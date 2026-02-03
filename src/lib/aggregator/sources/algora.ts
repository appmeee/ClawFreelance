/**
 * Algora Bounty Fetcher
 *
 * Algora bounties are created on GitHub issues via `/bounty $X` comments.
 * This source tracks known Algora-active repositories and looks for
 * Algora-specific patterns in issues.
 *
 * Algora patterns:
 * - Comment: `/bounty $1000`
 * - Label: `💎 Bounty` or `algora`
 * - Title/body: Contains reward info from Algora bot
 */

import type { BountySource, NormalizedTask, RawBounty } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

// Repositories known to use Algora for bounties
// These repos frequently post bounties via Algora's GitHub integration
export const ALGORA_REPOS = [
  // ZIO ecosystem
  'zio/zio',
  'zio/zio-blocks',

  // Golem Cloud
  'golemcloud/golem-cli',
  'golemcloud/golem-ai',

  // Other active Algora users
  'omnigres/omnigres',
  'Mudlet/Mudlet',
  'archestra-ai/archestra',
  'ether/etherpad-lite',
];

// Algora-specific labels
const ALGORA_LABELS = ['💎 Bounty', 'algora', 'bounty'];

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  labels: Array<{ name: string; color: string }>;
  user: {
    login: string;
    id: number;
  };
  created_at: string;
  updated_at: string;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
}

interface AlgoraSourceConfig {
  enabled: boolean;
  repositories: string[];
  token?: string;
}

/**
 * Extract Algora bounty amount from text (issue body or comments)
 * Looks for patterns like:
 * - `/bounty $1000`
 * - `💎 $500 bounty`
 * - `## 💎 $2,500 bounty`
 * - Algora bot comments with reward info
 */
function extractAlgoraReward(text: string | null): { amount: number; currency: string } | null {
  if (!text) return null;

  // Pattern: /bounty $X or 💎 $X (various formats)
  const patterns = [
    /\/bounty\s+\$(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /💎\s*\$(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /##\s*💎\s*\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*bounty/i,
    /bounty[:\s]+\$(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /reward[:\s]+\$(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /\$(\d+(?:,\d{3})*)\s*bounty/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        amount: parseFloat(match[1].replace(/,/g, '')),
        currency: 'USD',
      };
    }
  }

  return null;
}

interface GitHubComment {
  body: string;
  user: { login: string };
}

/**
 * Check if an issue is an Algora bounty
 */
function isAlgoraBounty(issue: GitHubIssue): boolean {
  // Check labels
  const hasAlgoraLabel = issue.labels.some((l) =>
    ALGORA_LABELS.some((al) => l.name.toLowerCase().includes(al.toLowerCase()))
  );

  if (hasAlgoraLabel) return true;

  // Check body for Algora patterns
  if (issue.body) {
    const hasAlgoraPattern =
      issue.body.includes('/bounty') ||
      issue.body.includes('💎') ||
      issue.body.toLowerCase().includes('algora');
    if (hasAlgoraPattern) return true;
  }

  return false;
}

export class AlgoraBountySource implements BountySource {
  readonly name = 'algora' as const;
  private config: AlgoraSourceConfig;

  constructor(config: Partial<AlgoraSourceConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      repositories: config.repositories || ALGORA_REPOS,
      token: config.token || process.env.GITHUB_TOKEN,
    };
  }

  private async fetchWithAuth(url: string): Promise<Response> {
    // Use centralized async auth (GitHub App > PAT > unauthenticated)
    const { getGitHubAuthHeaderAsync } = await import('../github-app-auth');

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    const authHeader = await getGitHubAuthHeaderAsync();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    return fetch(url, { headers });
  }

  /**
   * Fetch comments for an issue to find bounty amount
   * Algora bounties are posted as comments, not in issue body
   */
  private async fetchCommentsForBounty(
    repo: string,
    issueNumber: number
  ): Promise<{ amount: number; currency: string } | null> {
    const url = `${GITHUB_API_BASE}/repos/${repo}/issues/${issueNumber}/comments?per_page=10`;

    try {
      const response = await this.fetchWithAuth(url);
      if (!response.ok) return null;

      const comments: GitHubComment[] = await response.json();

      // Check each comment for bounty amount (usually in first few comments)
      for (const comment of comments) {
        const reward = extractAlgoraReward(comment.body);
        if (reward && reward.amount >= 10) {
          return reward;
        }
      }
    } catch {
      // Silently fail - we'll just not have the amount
    }

    return null;
  }

  private async fetchFromRepo(repo: string): Promise<RawBounty[]> {
    const bounties: RawBounty[] = [];
    const seenIssues = new Set<number>();

    for (const label of ALGORA_LABELS) {
      const query = encodeURIComponent(`repo:${repo} is:issue is:open label:"${label}"`);
      const url = `${GITHUB_API_BASE}/search/issues?q=${query}&per_page=50&sort=updated`;

      try {
        const response = await this.fetchWithAuth(url);

        if (!response.ok) {
          if (response.status === 403) {
            console.warn(`[algora] Rate limit hit for ${repo}`);
            return bounties;
          }
          continue;
        }

        const data: GitHubSearchResponse = await response.json();

        for (const issue of data.items) {
          if (seenIssues.has(issue.number)) continue;
          if (!isAlgoraBounty(issue)) continue;

          seenIssues.add(issue.number);

          // First try to extract reward from issue body/title
          let reward = extractAlgoraReward(issue.body);

          // If not found in body, fetch comments (Algora posts bounty in comments)
          if (!reward || reward.amount < 10) {
            reward = await this.fetchCommentsForBounty(repo, issue.number);
            // Small delay between comment fetches
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          bounties.push({
            source: 'algora',
            externalId: `algora-${repo}-${issue.number}`,
            externalUrl: issue.html_url,
            title: issue.title,
            description: issue.body || '',
            ownerExternalId: issue.user.login,
            ownerName: issue.user.login,
            labels: issue.labels.map((l) => l.name),
            rewardAmount: reward?.amount,
            rewardCurrency: reward?.currency,
            createdAt: new Date(issue.created_at),
            updatedAt: new Date(issue.updated_at),
            raw: issue,
          });
        }

        // Respect GitHub Search API rate limits (30 req/min)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[algora] Error fetching ${repo}:`, error);
      }
    }

    return bounties;
  }

  async fetch(): Promise<RawBounty[]> {
    if (!this.config.enabled) {
      return [];
    }

    const allBounties: RawBounty[] = [];

    for (const repo of this.config.repositories) {
      const bounties = await this.fetchFromRepo(repo);
      allBounties.push(...bounties);
      // Respect GitHub Search API rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return allBounties;
  }

  normalize(raw: RawBounty): NormalizedTask {
    // Use pre-fetched reward, or try extracting from description as fallback
    let rewardAmount = raw.rewardAmount || 0;
    let rewardCurrency = raw.rewardCurrency || 'USD';

    // If no pre-parsed reward, try extracting from description
    if (!rewardAmount && raw.description) {
      const extracted = extractAlgoraReward(raw.description);
      if (extracted) {
        rewardAmount = extracted.amount;
        rewardCurrency = extracted.currency;
      }
    }

    const hasReward = rewardAmount >= 10;

    return {
      title: raw.title,
      description: raw.description,
      type: 'bounty',
      source: 'algora',
      externalUrl: raw.externalUrl,
      ownerExternalId: raw.ownerExternalId,
      rewardType: hasReward ? 'external' : 'points',
      rewardAmount,
      rewardCurrency,
      visibility: 'public',
      isMilestoneBased: false,
      status: 'open',
      verificationMethod: 'pr_merged',
      difficulty: 'medium', // Algora doesn't provide difficulty info
      requirements: [],
      deadline: raw.deadline,
    };
  }
}

export function createAlgoraSource(customRepos?: string[]): AlgoraBountySource {
  return new AlgoraBountySource({
    token: process.env.GITHUB_TOKEN,
    repositories: customRepos || ALGORA_REPOS,
  });
}
