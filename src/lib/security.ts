import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// IP blocklist for known bad actors (in production, use Redis or database)
const ipBlocklist = new Set<string>();

// Failed authentication attempts tracking
const authFailures = new Map<string, { count: number; lastAttempt: number }>();
const MAX_AUTH_FAILURES = 5;
const AUTH_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter
 * In production, replace with Redis-based implementation
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    // New window
    const resetAt = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * Generate a secure API key
 */
export function generateApiKey(): { key: string; hash: string } {
  const key = `clf_${randomBytes(32).toString('hex')}`;
  const hash = hashApiKey(key);
  return { key, hash };
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key against stored hash (timing-safe)
 */
export function verifyApiKey(key: string, storedHash: string): boolean {
  const keyHash = hashApiKey(key);
  const keyHashBuffer = Buffer.from(keyHash, 'hex');
  const storedHashBuffer = Buffer.from(storedHash, 'hex');

  if (keyHashBuffer.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(keyHashBuffer, storedHashBuffer);
}

/**
 * Extract API key from request headers
 */
export function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const apiKeyHeader = request.headers.get('x-api-key');
  return apiKeyHeader;
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest): string {
  // Prefer X-Forwarded-For for proxied requests
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to real IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Last resort
  return 'unknown';
}

/**
 * Validate input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.slice(0, 10000);
  }

  return sanitized;
}

/**
 * Check if a string looks like it might contain malicious content
 */
export function containsSuspiciousContent(input: string): boolean {
  const suspiciousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /data:text\/html/i,
    /on\w+\s*=/i, // event handlers
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false;
  }

  const tokenBuffer = Buffer.from(token);
  const storedBuffer = Buffer.from(storedToken);

  if (tokenBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(tokenBuffer, storedBuffer);
}

/**
 * Check if an IP is blocked
 */
export function isIpBlocked(ip: string): boolean {
  return ipBlocklist.has(ip);
}

/**
 * Block an IP address
 */
export function blockIp(ip: string): void {
  ipBlocklist.add(ip);
}

/**
 * Track failed authentication attempt
 * Returns true if the IP should be locked out
 */
export function trackAuthFailure(ip: string): boolean {
  const now = Date.now();
  const record = authFailures.get(ip);

  if (!record || now - record.lastAttempt > AUTH_LOCKOUT_MS) {
    // Reset counter if lockout period has passed
    authFailures.set(ip, { count: 1, lastAttempt: now });
    return false;
  }

  record.count++;
  record.lastAttempt = now;

  if (record.count >= MAX_AUTH_FAILURES) {
    return true; // Should lock out
  }

  return false;
}

/**
 * Check if IP is locked out from auth attempts
 */
export function isAuthLockedOut(ip: string): { locked: boolean; remainingMs?: number } {
  const record = authFailures.get(ip);
  if (!record) return { locked: false };

  const now = Date.now();
  const timeSinceLastAttempt = now - record.lastAttempt;

  if (record.count >= MAX_AUTH_FAILURES && timeSinceLastAttempt < AUTH_LOCKOUT_MS) {
    return {
      locked: true,
      remainingMs: AUTH_LOCKOUT_MS - timeSinceLastAttempt,
    };
  }

  return { locked: false };
}

// ============================================
// INJECTION PROTECTION
// ============================================

/**
 * SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE)\b)/i,
  /(\b(UNION|JOIN)\s+\b)/i,
  /(--|#|\/\*|\*\/)/,
  /(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/i,
  /'\s*(OR|AND)\s*'.*'=/i,
  /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
  /WAITFOR\s+DELAY/i,
  /BENCHMARK\s*\(/i,
  /SLEEP\s*\(/i,
];

/**
 * Command injection patterns
 */
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]\\]/,
  /\b(cat|ls|rm|mv|cp|chmod|chown|wget|curl|nc|bash|sh|zsh|python|perl|ruby|php)\b/i,
  /\.\.\//,
  /\/etc\/(passwd|shadow|hosts)/i,
  /\/(bin|usr|var|tmp|dev)\//i,
];

/**
 * Prompt injection patterns for AI-targeted attacks
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(everything|all|previous)/i,
  /new\s+instructions?:/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /###\s*(system|instruction|prompt)/i,
  /pretend\s+(you|to\s+be)/i,
  /act\s+as\s+(if|a)/i,
  /roleplay\s+as/i,
  /you\s+are\s+now/i,
  /bypass\s+(safety|security|restrictions?)/i,
  /jailbreak/i,
  /DAN\s*mode/i,
  /developer\s*mode/i,
  /\bdo\s+anything\s+now\b/i,
];

/**
 * XSS patterns
 */
const XSS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
  /expression\s*\(/i,
  /eval\s*\(/i,
  /document\.(cookie|location|write)/i,
  /window\.(location|open)/i,
  /innerHTML/i,
  /outerHTML/i,
  /insertAdjacentHTML/i,
];

/**
 * Check for SQL injection attempts
 */
export function detectSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Check for command injection attempts
 */
export function detectCommandInjection(input: string): boolean {
  return COMMAND_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Check for prompt injection attempts
 */
export function detectPromptInjection(input: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Check for XSS attempts
 */
export function detectXss(input: string): boolean {
  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Comprehensive injection detection
 */
export function detectInjection(input: string): {
  detected: boolean;
  types: string[];
} {
  const types: string[] = [];

  if (detectSqlInjection(input)) types.push('sql');
  if (detectCommandInjection(input)) types.push('command');
  if (detectPromptInjection(input)) types.push('prompt');
  if (detectXss(input)) types.push('xss');

  return {
    detected: types.length > 0,
    types,
  };
}

// ============================================
// TASK VALIDATION
// ============================================

/**
 * Malicious task patterns to detect
 */
const MALICIOUS_TASK_PATTERNS = [
  // Credential harvesting
  /\b(password|credential|secret|api.?key|token|private.?key)\s*(harvesting|stealing|extraction|collection)/i,
  /steal\s+(password|credential|secret|token)/i,
  /capture\s+(login|credential|password)/i,
  /phishing/i,

  // Malware-related
  /\b(malware|virus|trojan|ransomware|keylogger|spyware|backdoor|rootkit)\b/i,
  /create\s+(malware|virus|exploit)/i,
  /write\s+(a\s+)?(payload|exploit|shellcode)/i,

  // Hacking instructions
  /\b(hack|crack|breach|penetrate)\s+(into|the)/i,
  /unauthorized\s+access/i,
  /bypass\s+(authentication|security|firewall)/i,
  /exploit\s+(vulnerability|bug|flaw)/i,

  // Data exfiltration
  /exfiltrate\s+data/i,
  /data\s+theft/i,
  /scrape\s+(personal|private|user)\s+data/i,

  // Spam/abuse
  /send\s+(spam|bulk\s+email|unsolicited)/i,
  /mass\s+(email|message)/i,
  /bot\s+(network|farm|attack)/i,

  // DoS/DDoS
  /\b(dos|ddos)\s+(attack)?/i,
  /denial.of.service/i,
  /flood\s+(attack|server)/i,

  // Cryptocurrency attacks
  /crypto\s*(jacking|miner|mining)/i,
  /mine\s+crypto/i,

  // Social engineering
  /social\s+engineer/i,
  /impersonate\s+(user|admin|staff)/i,
  /fake\s+(identity|account|profile)/i,
];

/**
 * Suspicious URL patterns
 */
const SUSPICIOUS_URL_PATTERNS = [
  /bit\.ly|tinyurl|t\.co|goo\.gl/i, // URL shorteners (could hide malicious URLs)
  /\.(ru|cn|tk|ml|ga|cf)$/i, // Suspicious TLDs
  /pastebin\.com|hastebin\.com|ghostbin/i, // Paste sites (could contain malicious code)
  /(dropbox|drive\.google|mega\.nz).*\?/i, // File sharing with params
];

export interface TaskValidationResult {
  valid: boolean;
  issues: string[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
}

/**
 * Validate a task for malicious content
 */
export function validateTaskContent(
  title: string,
  description: string,
  externalUrl?: string
): TaskValidationResult {
  const issues: string[] = [];
  let severity: TaskValidationResult['severity'] = 'none';

  const fullText = `${title} ${description}`.toLowerCase();

  // Check for malicious patterns
  for (const pattern of MALICIOUS_TASK_PATTERNS) {
    if (pattern.test(fullText)) {
      issues.push(`Detected potentially malicious content: ${pattern.source.slice(0, 30)}...`);
      severity = 'critical';
    }
  }

  // Check for injection attempts in task content
  const titleInjection = detectInjection(title);
  const descInjection = detectInjection(description);

  if (titleInjection.detected) {
    issues.push(`Title contains potential ${titleInjection.types.join(', ')} injection`);
    severity = severity === 'none' ? 'high' : severity;
  }

  if (descInjection.detected) {
    issues.push(`Description contains potential ${descInjection.types.join(', ')} injection`);
    severity = severity === 'none' ? 'medium' : severity;
  }

  // Check external URL
  if (externalUrl) {
    for (const pattern of SUSPICIOUS_URL_PATTERNS) {
      if (pattern.test(externalUrl)) {
        issues.push('External URL uses a suspicious domain or URL shortener');
        severity = severity === 'none' ? 'low' : severity;
      }
    }
  }

  // Check for excessive links (potential spam)
  const urlCount = (description.match(/https?:\/\//gi) || []).length;
  if (urlCount > 10) {
    issues.push('Description contains excessive URLs (potential spam)');
    severity = severity === 'none' ? 'medium' : severity;
  }

  // Check for excessive caps (potential spam)
  const capsRatio = (description.match(/[A-Z]/g) || []).length / description.length;
  if (capsRatio > 0.5 && description.length > 50) {
    issues.push('Description contains excessive capital letters');
    severity = severity === 'none' ? 'low' : severity;
  }

  // Determine if task should be blocked
  const blocked = severity === 'critical' || severity === 'high';

  return {
    valid: issues.length === 0,
    issues,
    severity,
    blocked,
  };
}

// ============================================
// CSRF PROTECTION
// ============================================

// CSRF token store (in production, use Redis with expiration)
const csrfTokens = new Map<string, { token: string; createdAt: number }>();
const CSRF_TOKEN_EXPIRY_MS = 3600000; // 1 hour

/**
 * Create and store a CSRF token for a session
 */
export function createCsrfTokenForSession(sessionId: string): string {
  const token = generateCsrfToken();
  csrfTokens.set(sessionId, { token, createdAt: Date.now() });

  // Clean up expired tokens periodically
  cleanupExpiredCsrfTokens();

  return token;
}

/**
 * Validate CSRF token for a session
 */
export function validateCsrfTokenForSession(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored) {
    return false;
  }

  // Check expiration
  if (Date.now() - stored.createdAt > CSRF_TOKEN_EXPIRY_MS) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return verifyCsrfToken(token, stored.token);
}

/**
 * Clean up expired CSRF tokens
 * Exported for testing purposes
 */
export function cleanupExpiredCsrfTokens(): void {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (now - data.createdAt > CSRF_TOKEN_EXPIRY_MS) {
      csrfTokens.delete(sessionId);
    }
  }
}

/**
 * Validate Origin/Referer header for CSRF protection
 */
export function validateCsrfHeaders(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // If no origin header, check referer
  const checkValue = origin || (referer ? new URL(referer).origin : null);

  if (!checkValue) {
    // Same-origin requests might not have these headers
    // Be strict for API calls - require the header
    return false;
  }

  return allowedOrigins.includes(checkValue);
}

// ============================================
// ENHANCED SANITIZATION
// ============================================

/**
 * Enhanced input sanitization that removes malicious content
 */
export function sanitizeInputStrict(input: string): string {
  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Remove potential script injection
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Trim and limit length
  sanitized = sanitized.trim();
  if (sanitized.length > 10000) {
    sanitized = sanitized.slice(0, 10000);
  }

  return sanitized;
}

/**
 * Sanitize markdown content while preserving safe formatting
 */
export function sanitizeMarkdown(input: string): string {
  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Allow safe markdown but escape HTML
  sanitized = sanitized.replace(
    /<(?!\/?(b|i|em|strong|code|pre|h[1-6]|ul|ol|li|p|br|a\s))[^>]+>/gi,
    ''
  );

  // Limit length
  if (sanitized.length > 50000) {
    sanitized = sanitized.slice(0, 50000);
  }

  return sanitized;
}
