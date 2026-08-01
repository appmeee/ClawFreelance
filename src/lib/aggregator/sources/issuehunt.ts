/**
 * IssueHunt Bounty Fetcher
 *
 * IssueHunt bounties are created on GitHub issues via IssueHunt integrations or `/issuehunt` comments.
 * This source tracks known IssueHunt-active repositories and looks for IssueHunt-specific patterns in issues.
 *
 * IssueHunt patterns:
 * - Comment: `/issuehunt $X` or `💵 Funded on Issuehunt`
 * - Label: `issuehunt`, `💵 Funded on Issuehunt`, or `bounty`
 * - Title/body: Contains reward info from IssueHunt bot
 */

import type { BountySource, NormalizedTask, RawBounty } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export const ISSUEHUNT_REPOS = [
  'sindresorhus/fkill',
  'wulkano/Kap',
  'sindresorhus/macos-wallpaper',
  'BoostIO/Boostnote',
  'CodeHarborHub/codeharborhub.github.io',
];

const ISSUEHUNT_LABELS = ['💵 Funded on Issuehunt', 'issuehunt', 'bounty'];

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

interface IssueHuntSourceConfig {
  enabled: boolean;
  repositories: string[];
  token?: string;
}

export function extractIssueHuntReward(text: string | null): { amount: number; currency: string } | null {
  if (!text) return null;

  const patterns = [
    /\/issuehunt\s+\$(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /💵\s*\$(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /##\s*💵\s*\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*bounty/i,
    /issuehunt[:\s]+\$(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /reward[:\s]+\$(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /\$(\d+(?:,\d{3})*)\s*funded on issuehunt/i,
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

export class IssueHuntSource implements BountySource {
  name = 'issuehunt';
  type = 'github_issuehunt' as const;
  private config: IssueHuntSourceConfig;

  constructor(config: Partial<IssueHuntSourceConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      repositories: config.repositories ?? ISSUEHUNT_REPOS,
      token: config.token || process.env.GITHUB_TOKEN,
    };
  }

  async fetchBounties(): Promise<RawBounty[]> {
    if (!this.config.enabled) return [];

    const bounties: RawBounty[] = [];
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ClawFreelance-Aggregator',
    };

    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`;
    }

    try {
      const query = `is:issue is:open label:"💵 Funded on Issuehunt",issuehunt`;
      const url = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(query)}&per_page=50`;

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = (await response.json()) as GitHubSearchResponse;
        for (const issue of data.items) {
          const reward = extractIssueHuntReward(issue.body) || { amount: 50, currency: 'USD' };
          bounties.push(this.formatGitHubIssue(issue, reward));
        }
      }
    } catch (error) {
      console.error('Error fetching IssueHunt bounties:', error);
    }

    return bounties;
  }

  normalize(raw: RawBounty): NormalizedTask {
    const data = raw.raw_data as Partial<GitHubIssue> & { repo?: string };
    return {
      id: raw.id,
      source: this.name,
      sourceUrl: raw.url,
      title: raw.title,
      description: raw.description,
      reward: raw.reward_amount,
      currency: raw.reward_currency,
      rewardType: 'fixed',
      status: 'open',
      createdAt: raw.created_at,
      updatedAt: new Date().toISOString(),
      tags: ['issuehunt', 'bounty', 'github'],
      metadata: {
        issueNumber: data.number,
        repository: data.repo,
      },
    };
  }

  private formatGitHubIssue(issue: GitHubIssue, reward: { amount: number; currency: string }): RawBounty {
    const repoMatch = issue.html_url.match(/github\.com\/([^/]+\/[^/]+)/);
    const repo = repoMatch ? repoMatch[1] : 'unknown';

    return {
      id: `issuehunt-${issue.id}`,
      title: issue.title,
      description: issue.body || '',
      url: issue.html_url,
      reward_amount: reward.amount,
      reward_currency: reward.currency,
      created_at: issue.created_at,
      raw_data: {
        ...issue,
        repo,
      },
    };
  }
}
