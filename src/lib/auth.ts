import { NextRequest, NextResponse } from 'next/server';

import { checkRateLimit, extractApiKey, getClientIdentifier } from './security';

/**
 * Authentication and authorization utilities for ClawFreelance API
 */

export interface AuthenticatedAgent {
  id: string;
  displayName: string;
  permissions: string[];
  source: string;
}

export interface AuthResult {
  authenticated: boolean;
  agent?: AuthenticatedAgent;
  error?: string;
  statusCode?: number;
}

/**
 * Verify API key and return agent information
 * In production, this would query the database
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    return {
      authenticated: false,
      error: 'Missing API key. Include Authorization: Bearer <key> or X-API-Key header.',
      statusCode: 401,
    };
  }

  // Validate API key format
  if (!apiKey.startsWith('clf_') || apiKey.length < 32) {
    return {
      authenticated: false,
      error: 'Invalid API key format.',
      statusCode: 401,
    };
  }

  // In production, look up the key hash in the database
  // For now, we'll simulate validation
  // const keyHash = hashApiKey(apiKey);
  // const apiKeyRecord = await db.query.apiKeys.findFirst({
  //   where: and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.revoked, false)),
  //   with: { agent: true },
  // });

  // Simulate a valid agent for demo
  // In production, return the actual agent from database
  const simulatedAgent: AuthenticatedAgent = {
    id: 'agent-demo',
    displayName: 'Demo Agent',
    permissions: ['read', 'write', 'claim'],
    source: 'openclaw',
  };

  return {
    authenticated: true,
    agent: simulatedAgent,
  };
}

/**
 * Authentication middleware wrapper for API routes
 */
export function withAuth(
  handler: (request: NextRequest, agent: AuthenticatedAgent) => Promise<NextResponse>,
  options: {
    requiredPermissions?: string[];
    rateLimit?: { maxRequests: number; windowMs: number };
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Rate limiting
    if (options.rateLimit) {
      const clientId = getClientIdentifier(request);
      const rateLimitResult = checkRateLimit(clientId, options.rateLimit);

      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(rateLimitResult.resetAt),
            },
          }
        );
      }
    }

    // Authenticate
    const authResult = await authenticateRequest(request);

    if (!authResult.authenticated || !authResult.agent) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.statusCode || 401 }
      );
    }

    // Check permissions
    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      const hasPermission = options.requiredPermissions.every((perm) =>
        authResult.agent!.permissions.includes(perm)
      );

      if (!hasPermission) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            required: options.requiredPermissions,
          },
          { status: 403 }
        );
      }
    }

    // Call the handler with the authenticated agent
    return handler(request, authResult.agent);
  };
}

/**
 * Optional authentication - continues even if not authenticated
 */
export async function optionalAuth(request: NextRequest): Promise<AuthenticatedAgent | null> {
  const authResult = await authenticateRequest(request);
  return authResult.authenticated ? authResult.agent || null : null;
}

/**
 * Validate content type for JSON requests
 */
export function validateContentType(request: NextRequest): { valid: boolean; error?: string } {
  const contentType = request.headers.get('content-type');

  if (!contentType) {
    return { valid: false, error: 'Content-Type header is required' };
  }

  if (!contentType.includes('application/json')) {
    return { valid: false, error: 'Content-Type must be application/json' };
  }

  return { valid: true };
}

/**
 * Validate request body size
 */
export function validateBodySize(
  contentLength: string | null,
  maxBytes: number = 1024 * 1024 // 1MB default
): { valid: boolean; error?: string } {
  if (!contentLength) {
    return { valid: true }; // Let the handler deal with it
  }

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) {
    return { valid: false, error: 'Invalid Content-Length header' };
  }

  if (size > maxBytes) {
    return {
      valid: false,
      error: `Request body too large. Maximum size is ${Math.round(maxBytes / 1024)}KB`,
    };
  }

  return { valid: true };
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string,
  statusCode: number = 400,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      error,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(data, {
    status: statusCode,
    headers: {
      ...headers,
    },
  });
}
