import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createAuditLog, logSecurityEvent } from '@/lib/audit';
import { validateBodySize, validateContentType } from '@/lib/auth';
import {
  blockIp,
  checkRateLimit,
  detectInjection,
  generateApiKey,
  getClientIdentifier,
  isAuthLockedOut,
  isIpBlocked,
  sanitizeInputStrict,
  trackAuthFailure,
} from '@/lib/security';

// Registration schema with strict validation
const registerAgentSchema = z.object({
  publicKey: z
    .string()
    .min(32, 'Public key must be at least 32 characters')
    .max(256, 'Public key must not exceed 256 characters')
    .regex(/^[a-zA-Z0-9+/=_-]+$/, 'Public key contains invalid characters'),
  displayName: z
    .string()
    .min(3, 'Display name must be at least 3 characters')
    .max(100, 'Display name must not exceed 100 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Display name can only contain letters, numbers, underscores, and hyphens'
    ),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address')
    .optional(),
  capabilities: z
    .array(
      z
        .string()
        .min(2, 'Capability must be at least 2 characters')
        .max(50, 'Capability must not exceed 50 characters')
        .regex(
          /^[a-z0-9-]+$/,
          'Capability can only contain lowercase letters, numbers, and hyphens'
        )
    )
    .max(20, 'Maximum 20 capabilities allowed')
    .default([]),
  source: z.enum(['openclaw', 'cloud', 'anonymous']).default('openclaw'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Track registration attempts for Sybil resistance
const registrationAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_REGISTRATIONS_PER_HOUR = 3;
const REGISTRATION_WINDOW_MS = 3600000; // 1 hour

/**
 * Check if IP has exceeded registration limits (Sybil resistance)
 */
function checkRegistrationLimit(ip: string): { allowed: boolean; remainingMs?: number } {
  const now = Date.now();
  const record = registrationAttempts.get(ip);

  if (!record) {
    return { allowed: true };
  }

  // Reset if window has passed
  if (now - record.firstAttempt > REGISTRATION_WINDOW_MS) {
    registrationAttempts.delete(ip);
    return { allowed: true };
  }

  if (record.count >= MAX_REGISTRATIONS_PER_HOUR) {
    return {
      allowed: false,
      remainingMs: REGISTRATION_WINDOW_MS - (now - record.firstAttempt),
    };
  }

  return { allowed: true };
}

/**
 * Track a registration attempt
 */
function trackRegistration(ip: string): void {
  const now = Date.now();
  const record = registrationAttempts.get(ip);

  if (!record || now - record.firstAttempt > REGISTRATION_WINDOW_MS) {
    registrationAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count++;
  }
}

/**
 * Validate public key format (basic cryptographic key validation)
 */
function validatePublicKeyFormat(key: string): { valid: boolean; error?: string } {
  // Check for common key formats
  const isHex = /^[0-9a-fA-F]+$/.test(key);
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(key);
  const isBase64Url = /^[A-Za-z0-9_-]+$/.test(key);

  if (!isHex && !isBase64 && !isBase64Url) {
    return { valid: false, error: 'Public key must be hex or base64 encoded' };
  }

  // Check for suspiciously simple keys
  if (/^(.)\1+$/.test(key)) {
    return { valid: false, error: 'Public key appears to be invalid (repeated characters)' };
  }

  // Check for common test/placeholder keys
  const invalidKeys = ['test', 'example', 'placeholder', '12345', 'abcde'];
  if (invalidKeys.some((invalid) => key.toLowerCase().includes(invalid))) {
    return { valid: false, error: 'Public key appears to be a test/placeholder value' };
  }

  return { valid: true };
}

/**
 * POST /api/agents/register - Register a new agent
 *
 * This is the primary endpoint for agents to join the platform.
 * Upon successful registration, an API key is generated for the agent.
 *
 * Security measures:
 * - Strict rate limiting (5 per hour per IP)
 * - Sybil resistance (max 3 registrations per IP per hour)
 * - Input validation and sanitization
 * - Injection detection
 * - Public key format validation
 * - Audit logging
 */
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);

  // Check if IP is blocked
  if (isIpBlocked(clientId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Check for auth lockout (too many failed attempts)
  const lockoutCheck = isAuthLockedOut(clientId);
  if (lockoutCheck.locked) {
    return NextResponse.json(
      {
        error: 'Too many failed attempts',
        retryAfter: Math.ceil((lockoutCheck.remainingMs || 0) / 1000),
      },
      { status: 429 }
    );
  }

  // Validate content type
  const contentTypeCheck = validateContentType(request);
  if (!contentTypeCheck.valid) {
    return NextResponse.json({ error: contentTypeCheck.error }, { status: 415 });
  }

  // Validate body size (100KB max for registration)
  const bodySizeCheck = validateBodySize(request.headers.get('content-length'), 100 * 1024);
  if (!bodySizeCheck.valid) {
    return NextResponse.json({ error: bodySizeCheck.error }, { status: 413 });
  }

  // Strict rate limiting for registration
  const rateLimit = checkRateLimit(`${clientId}:register`, { maxRequests: 5, windowMs: 3600000 });

  if (!rateLimit.allowed) {
    logSecurityEvent(request, 'suspicious_activity', 'Rate limit exceeded for registration');
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many registration attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      },
      { status: 429 }
    );
  }

  // Check Sybil resistance limit
  const sybilCheck = checkRegistrationLimit(clientId);
  if (!sybilCheck.allowed) {
    logSecurityEvent(request, 'suspicious_activity', 'Sybil resistance triggered', {
      ip: clientId,
    });
    return NextResponse.json(
      {
        error: 'Registration limit reached',
        message: 'You have reached the maximum number of agent registrations for this period.',
        retryAfter: Math.ceil((sybilCheck.remainingMs || 0) / 1000),
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    // Sanitize string inputs
    if (body.displayName) body.displayName = sanitizeInputStrict(body.displayName);
    if (body.publicKey) body.publicKey = sanitizeInputStrict(body.publicKey);

    // Check for injection attacks
    const displayNameInjection = detectInjection(body.displayName || '');
    const publicKeyInjection = detectInjection(body.publicKey || '');

    if (displayNameInjection.detected || publicKeyInjection.detected) {
      trackAuthFailure(clientId);
      logSecurityEvent(request, 'suspicious_activity', 'Injection attempt in registration', {
        displayNameTypes: displayNameInjection.types,
        publicKeyTypes: publicKeyInjection.types,
      });

      // If too many suspicious attempts, block the IP
      if (trackAuthFailure(clientId)) {
        blockIp(clientId);
        logSecurityEvent(
          request,
          'blocked_request',
          'IP blocked due to repeated injection attempts'
        );
      }

      return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
    }

    // Validate input schema
    const parsed = registerAgentSchema.safeParse(body);
    if (!parsed.success) {
      trackAuthFailure(clientId);
      return NextResponse.json(
        {
          error: 'Invalid registration data',
          details: parsed.error.flatten().fieldErrors,
          hint: {
            publicKey: 'Your cryptographic public key (32-256 chars, hex or base64)',
            displayName: 'A human-readable name (3-100 chars, alphanumeric with _ and -)',
            walletAddress: 'Ethereum address for receiving payments (optional)',
            capabilities: 'Array of skills your agent has (lowercase, hyphens allowed)',
            source: 'Where your agent runs: openclaw, cloud, or anonymous',
          },
        },
        { status: 400 }
      );
    }

    const agentData = parsed.data;

    // Validate public key format
    const keyValidation = validatePublicKeyFormat(agentData.publicKey);
    if (!keyValidation.valid) {
      trackAuthFailure(clientId);
      return NextResponse.json(
        {
          error: 'Invalid public key',
          message: keyValidation.error,
        },
        { status: 400 }
      );
    }

    // Check for duplicate public key (in production, check DB)
    // For now, we'll simulate
    // const existingAgent = await db.query.agents.findFirst({
    //   where: eq(agents.publicKey, agentData.publicKey),
    // });
    // if (existingAgent) {
    //   return NextResponse.json({ error: 'Public key already registered' }, { status: 409 });
    // }

    // Track this registration
    trackRegistration(clientId);

    // Generate agent ID and API key
    const agentId = `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const { key: apiKey, hash: _apiKeyHash } = generateApiKey();

    // Create agent record (in production, insert into DB)
    const newAgent = {
      id: agentId,
      publicKey: agentData.publicKey,
      displayName: agentData.displayName,
      walletAddress: agentData.walletAddress,
      capabilities: agentData.capabilities,
      source: agentData.source,
      reputationScore: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Audit log (don't include the raw API key)
    createAuditLog(request, 'agent.register', {
      actorType: 'anonymous',
      resourceType: 'agent',
      resourceId: agentId,
      success: true,
      metadata: {
        displayName: agentData.displayName,
        source: agentData.source,
        capabilitiesCount: agentData.capabilities.length,
        hasWallet: !!agentData.walletAddress,
      },
    });

    // Response with API key (only shown once!)
    return NextResponse.json(
      {
        message: 'Agent registered successfully',
        agent: {
          id: newAgent.id,
          displayName: newAgent.displayName,
          capabilities: newAgent.capabilities,
          source: newAgent.source,
          reputationScore: newAgent.reputationScore,
          status: newAgent.status,
          createdAt: newAgent.createdAt,
        },
        authentication: {
          apiKey: apiKey,
          warning:
            'SAVE THIS API KEY SECURELY! It will only be shown once and cannot be recovered.',
          security: [
            'Store this key in environment variables, never in code',
            'Do not share this key with anyone',
            'Rotate keys regularly',
            'Revoke immediately if compromised',
          ],
          usage: {
            header: 'Authorization: Bearer <api_key>',
            alternativeHeader: 'X-API-Key: <api_key>',
          },
        },
        nextSteps: [
          'Save your API key securely',
          'Use the /api/v1/tasks endpoint to browse available tasks',
          'Claim tasks with POST /api/v1/tasks/{taskId}/claim',
          'Submit completed work with POST /api/v1/tasks/{taskId}/submit',
        ],
      },
      {
        status: 201,
        headers: {
          Location: `/api/agents/${newAgent.id}`,
          // Prevent caching of response containing API key
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    // Don't leak error details
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
