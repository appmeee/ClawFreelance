import { NextRequest } from 'next/server';

import { getClientIdentifier } from './security';

/**
 * Audit logging utilities for ClawFreelance
 *
 * All security-relevant actions should be logged for:
 * - Security monitoring and incident response
 * - Compliance and accountability
 * - Debugging and troubleshooting
 */

export type AuditAction =
  | 'agent.register'
  | 'agent.login'
  | 'agent.update'
  | 'agent.delete'
  | 'agent.suspend'
  | 'task.create'
  | 'task.update'
  | 'task.delete'
  | 'task.claim'
  | 'task.unclaim'
  | 'task.submit'
  | 'task.verify'
  | 'task.complete'
  | 'task.dispute'
  | 'api_key.create'
  | 'api_key.revoke'
  | 'api_key.use'
  | 'payment.initiate'
  | 'payment.complete'
  | 'payment.refund'
  | 'auth.success'
  | 'auth.failure'
  | 'rate_limit.exceeded'
  | 'security.suspicious_activity'
  | 'security.blocked_request';

export type ActorType = 'agent' | 'system' | 'anonymous' | 'admin';

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  action: AuditAction;
  actorId: string | null;
  actorType: ActorType;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string | null;
  requestId: string | null;
  success: boolean;
  errorMessage?: string;
}

/**
 * In-memory audit log buffer for async processing
 * In production, this would write to a database or log aggregation service
 */
const auditBuffer: AuditLogEntry[] = [];
const MAX_BUFFER_SIZE = 1000;

/**
 * Create an audit log entry
 */
export function createAuditLog(
  request: NextRequest,
  action: AuditAction,
  options: {
    actorId?: string | null;
    actorType?: ActorType;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
  }
): AuditLogEntry {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    actorId: options.actorId ?? null,
    actorType: options.actorType ?? 'anonymous',
    resourceType: options.resourceType,
    resourceId: options.resourceId ?? null,
    metadata: options.metadata ?? {},
    ipAddress: getClientIdentifier(request),
    userAgent: request.headers.get('user-agent'),
    requestId: request.headers.get('x-request-id'),
    success: options.success ?? true,
    errorMessage: options.errorMessage,
  };

  // Add to buffer (async processing)
  logAuditEntry(entry);

  return entry;
}

/**
 * Log an audit entry
 * In production, this would persist to database/logging service
 */
function logAuditEntry(entry: AuditLogEntry): void {
  // Add to buffer
  auditBuffer.push(entry);

  // Prevent buffer overflow
  if (auditBuffer.length > MAX_BUFFER_SIZE) {
    auditBuffer.shift();
  }

  // In production, flush to database periodically
  // For now, log security-relevant entries to console
  if (shouldLogToConsole(entry)) {
    const logLevel = entry.success ? 'info' : 'warn';
    console[logLevel](
      JSON.stringify({
        audit: true,
        ...entry,
        // Redact sensitive fields
        metadata: redactSensitiveData(entry.metadata),
      })
    );
  }
}

/**
 * Determine if an entry should be logged to console
 */
function shouldLogToConsole(entry: AuditLogEntry): boolean {
  // Always log security-relevant events
  const alwaysLogActions: AuditAction[] = [
    'auth.failure',
    'rate_limit.exceeded',
    'security.suspicious_activity',
    'security.blocked_request',
    'api_key.create',
    'api_key.revoke',
    'payment.initiate',
    'payment.complete',
    'agent.register',
    'agent.suspend',
  ];

  // Log failures
  if (!entry.success) return true;

  // Log security events
  if (alwaysLogActions.includes(entry.action)) return true;

  // In development, log everything
  if (process.env.NODE_ENV === 'development') return true;

  return false;
}

/**
 * Redact sensitive data from metadata
 */
function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'apiKey',
    'api_key',
    'token',
    'secret',
    'privateKey',
    'private_key',
    'authorization',
    'cookie',
  ];

  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Get recent audit logs (for debugging/admin)
 */
export function getRecentAuditLogs(limit: number = 100): AuditLogEntry[] {
  return auditBuffer.slice(-limit);
}

/**
 * Get audit logs for a specific actor
 */
export function getAuditLogsForActor(actorId: string, limit: number = 100): AuditLogEntry[] {
  return auditBuffer.filter((entry) => entry.actorId === actorId).slice(-limit);
}

/**
 * Log a security event (convenience function)
 */
export function logSecurityEvent(
  request: NextRequest,
  type: 'suspicious_activity' | 'blocked_request',
  reason: string,
  metadata?: Record<string, unknown>
): void {
  createAuditLog(request, `security.${type}` as AuditAction, {
    actorType: 'anonymous',
    resourceType: 'security',
    metadata: {
      reason,
      ...metadata,
    },
    success: false,
  });
}

/**
 * Log authentication attempt
 */
export function logAuthAttempt(
  request: NextRequest,
  success: boolean,
  agentId?: string,
  errorMessage?: string
): void {
  createAuditLog(request, success ? 'auth.success' : 'auth.failure', {
    actorId: agentId,
    actorType: agentId ? 'agent' : 'anonymous',
    resourceType: 'auth',
    success,
    errorMessage,
  });
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(
  request: NextRequest,
  endpoint: string,
  agentId?: string
): void {
  createAuditLog(request, 'rate_limit.exceeded', {
    actorId: agentId,
    actorType: agentId ? 'agent' : 'anonymous',
    resourceType: 'rate_limit',
    metadata: { endpoint },
    success: false,
  });
}
