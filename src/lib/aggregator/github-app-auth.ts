/**
 * GitHub App Authentication
 *
 * Generates JWT tokens for GitHub App authentication, providing
 * 15,000+ requests/hour vs 5,000 with PAT or 60 unauthenticated.
 *
 * Environment variables:
 * - GITHUB_APP_ID: The App ID from GitHub App settings
 * - GITHUB_APP_PRIVATE_KEY: The private key (PEM format, can include \n)
 *
 * Falls back to GITHUB_TOKEN if App credentials aren't configured.
 *
 * @see https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app
 */

import jwt from 'jsonwebtoken';

interface GitHubAppConfig {
  appId: string;
  privateKey: string;
}

// Cache the JWT to avoid regenerating on every request
// JWTs are valid for up to 10 minutes, we regenerate at 9 minutes
let cachedJwt: { token: string; expiresAt: number } | null = null;

// Cache the installation token (valid for 1 hour, regenerate at 55 mins)
let cachedInstallationToken: { token: string; expiresAt: number } | null = null;

/**
 * Check if GitHub App credentials are configured
 */
export function isGitHubAppConfigured(): boolean {
  return !!(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY);
}

/**
 * Get GitHub App configuration from environment
 */
function getAppConfig(): GitHubAppConfig | null {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    return null;
  }

  // Handle escaped newlines in environment variable
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  return { appId, privateKey: formattedKey };
}

/**
 * Generate a JWT for GitHub App authentication
 *
 * The JWT is used to authenticate as the GitHub App itself.
 * For accessing public repos, this JWT alone is sufficient.
 * For private repos, you'd need an installation access token.
 */
export function generateAppJwt(): string | null {
  const config = getAppConfig();
  if (!config) {
    return null;
  }

  // Check cache - reuse if not expired (with 1 minute buffer)
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.expiresAt > now + 60) {
    return cachedJwt.token;
  }

  // GitHub App JWTs are valid for max 10 minutes
  // We set expiry to 9 minutes to be safe
  const payload = {
    iat: now - 60, // Issued 60 seconds ago (clock skew buffer)
    exp: now + 9 * 60, // Expires in 9 minutes
    iss: config.appId,
  };

  try {
    const token = jwt.sign(payload, config.privateKey, { algorithm: 'RS256' });

    // Cache the token
    cachedJwt = {
      token,
      expiresAt: payload.exp,
    };

    return token;
  } catch (error) {
    console.error('[github-app] Failed to generate JWT:', error);
    return null;
  }
}

/**
 * Get an installation access token for API requests
 * This provides the higher rate limits (15,000+ req/hr)
 */
async function getInstallationToken(): Promise<string | null> {
  // Check cache first
  const now = Math.floor(Date.now() / 1000);
  if (cachedInstallationToken && cachedInstallationToken.expiresAt > now + 300) {
    return cachedInstallationToken.token;
  }

  const appJwt = generateAppJwt();
  if (!appJwt) {
    console.warn('[github-app] No JWT available - App not configured?');
    return null;
  }

  try {
    // Get installations
    const installResponse = await fetch('https://api.github.com/app/installations', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${appJwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!installResponse.ok) {
      const errorText = await installResponse.text();
      console.error(
        '[github-app] Failed to get installations:',
        installResponse.status,
        errorText.slice(0, 200)
      );
      return null;
    }

    const installations = await installResponse.json();
    if (!Array.isArray(installations) || installations.length === 0) {
      console.warn('[github-app] No installations found - App not installed on any repos?');
      return null;
    }

    // Get token for first installation
    const installationId = installations[0].id;
    const tokenResponse = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${appJwt}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(
        '[github-app] Failed to get access token:',
        tokenResponse.status,
        errorText.slice(0, 200)
      );
      return null;
    }

    const tokenData = await tokenResponse.json();

    // Cache the token (expires in 1 hour)
    cachedInstallationToken = {
      token: tokenData.token,
      expiresAt: now + 55 * 60, // Refresh 5 mins early
    };

    return tokenData.token;
  } catch (error) {
    console.error('[github-app] Failed to get installation token:', error);
    return null;
  }
}

/**
 * Get the best available authorization header for GitHub API requests
 *
 * Priority:
 * 1. GitHub App Installation Token (15,000+ req/hr)
 * 2. Personal Access Token (5,000 req/hr)
 * 3. None (60 req/hr)
 */
export async function getGitHubAuthHeaderAsync(): Promise<string | null> {
  // Try GitHub App installation token first
  const installToken = await getInstallationToken();
  if (installToken) {
    return `Bearer ${installToken}`;
  }

  // Fall back to PAT
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    return `Bearer ${token}`;
  }

  // Only warn once about no auth - this is important to know
  console.warn('[github-app] No auth available - using unauthenticated (60 req/hr)');
  return null;
}

/**
 * Get the best available authorization header for GitHub API requests (sync version)
 * Note: Prefers cached tokens, falls back to PAT if no cached App token
 *
 * Priority:
 * 1. Cached Installation Token (15,000+ req/hr)
 * 2. Personal Access Token (5,000 req/hr)
 * 3. None (60 req/hr)
 */
export function getGitHubAuthHeader(): string | null {
  // Use cached installation token if available
  const now = Math.floor(Date.now() / 1000);
  if (cachedInstallationToken && cachedInstallationToken.expiresAt > now + 60) {
    return `Bearer ${cachedInstallationToken.token}`;
  }

  // Fall back to PAT
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    return `Bearer ${token}`;
  }

  // No auth available
  return null;
}

/**
 * Get headers for GitHub API requests with the best available auth
 */
export function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const authHeader = getGitHubAuthHeader();
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  return headers;
}

/**
 * Initialize GitHub App auth by pre-fetching installation token
 * Call this at startup to ensure the token is cached
 */
export async function initGitHubAppAuth(): Promise<boolean> {
  if (!isGitHubAppConfigured()) {
    console.log('[github-app] App not configured, falling back to PAT or unauthenticated');
    return false;
  }

  const token = await getInstallationToken();
  if (token) {
    console.log('[github-app] Authenticated (15,000+ req/hr)');
    return true;
  }

  console.warn('[github-app] Failed to authenticate');
  return false;
}

/**
 * Check current rate limit status
 * Useful for monitoring and debugging
 */
export async function checkRateLimit(): Promise<{
  limit: number;
  remaining: number;
  reset: Date;
  resource: string;
} | null> {
  try {
    // Use async version to ensure we have installation token
    const authHeader = await getGitHubAuthHeaderAsync();
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch('https://api.github.com/rate_limit', {
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const core = data.resources.core;

    return {
      limit: core.limit,
      remaining: core.remaining,
      reset: new Date(core.reset * 1000),
      resource: 'core',
    };
  } catch {
    return null;
  }
}
