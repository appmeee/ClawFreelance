/**
 * GitHub Issues Fetcher for Code Contributions
 *
 * Fetches general issues from GitHub repositories that are suitable for
 * contribution (good first issue, help wanted, etc.) but don't have bounties.
 * These are synced as 'code_contribution' type tasks with points rewards.
 */

import type { BountySource, NormalizedTask, RawBounty } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

// Labels that indicate contribution opportunities
const CONTRIBUTION_LABELS = [
  'good first issue',
  'help wanted',
  'beginner friendly',
  'starter',
  'easy pick',
  'first-timers-only',
  'up-for-grabs',
  'contributions welcome',
];

// Labels that indicate this is a bounty (skip these - handled by bounty source)
const BOUNTY_LABELS = [
  'bounty',
  'paid',
  'reward',
  'External', // Expensify
  'money',
  'gitcoin',
  'funding',
];

// Curated list of active open source repos with good contribution culture
export const CONTRIBUTION_REPOS = [
  // Developer Tools with active communities
  'vercel/next.js',
  'remix-run/remix',
  'sveltejs/svelte',
  'vuejs/core',
  'withastro/astro',
  'biomejs/biome',
  'vitejs/vite',

  // AI/ML
  'langchain-ai/langchain',
  'huggingface/transformers',
  'ollama/ollama',

  // Open Source Apps
  'calcom/cal.com',
  'twentyhq/twenty',
  'documenso/documenso',
  'formbricks/formbricks',
  'hoppscotch/hoppscotch',
  'nocodb/nocodb',
  'supabase/supabase',

  // Infrastructure
  'grafana/grafana',
  'prometheus/prometheus',
  'drizzle-team/drizzle-orm',
  'prisma/prisma',
];

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
  milestone?: {
    due_on: string | null;
  };
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
}

interface GitHubIssuesConfig {
  enabled: boolean;
  repositories: string[];
  contributionLabels: string[];
  excludeLabels: string[];
  token?: string;
}

/**
 * Infers difficulty from labels and issue content
 */
function inferDifficulty(
  labels: Array<{ name: string }>,
  body: string | null
): 'easy' | 'medium' | 'hard' {
  const labelNames = labels.map((l) => l.name.toLowerCase());

  if (
    labelNames.some((l) =>
      ['good first issue', 'beginner', 'easy', 'starter', 'trivial', 'first-timers-only'].includes(
        l
      )
    )
  ) {
    return 'easy';
  }

  if (labelNames.some((l) => ['hard', 'difficult', 'complex', 'expert', 'advanced'].includes(l))) {
    return 'hard';
  }

  if (body) {
    const lowerBody = body.toLowerCase();
    if (
      lowerBody.includes('simple fix') ||
      lowerBody.includes('quick fix') ||
      lowerBody.includes('typo')
    ) {
      return 'easy';
    }
    if (
      lowerBody.includes('architecture') ||
      lowerBody.includes('refactor') ||
      lowerBody.includes('redesign')
    ) {
      return 'hard';
    }
  }

  return 'medium';
}

/**
 * Extracts requirements from labels
 */
function extractRequirements(labels: Array<{ name: string }>): string[] {
  const requirements: string[] = [];
  const labelNames = labels.map((l) => l.name.toLowerCase());

  const techLabels = [
    'typescript',
    'javascript',
    'rust',
    'python',
    'go',
    'solidity',
    'react',
    'node',
    'web3',
    'css',
    'html',
  ];
  for (const tech of techLabels) {
    if (labelNames.some((l) => l.includes(tech))) {
      requirements.push(tech);
    }
  }

  if (labelNames.some((l) => l.includes('frontend'))) {
    requirements.push('frontend');
  }
  if (labelNames.some((l) => l.includes('backend'))) {
    requirements.push('backend');
  }
  if (labelNames.some((l) => l.includes('documentation') || l.includes('docs'))) {
    requirements.push('documentation');
  }
  if (labelNames.some((l) => l.includes('test'))) {
    requirements.push('testing');
  }
  if (labelNames.some((l) => l.includes('bug'))) {
    requirements.push('bug-fix');
  }
  if (labelNames.some((l) => l.includes('feature'))) {
    requirements.push('feature');
  }

  return requirements;
}

/**
 * Calculate points based on difficulty
 */
function calculatePoints(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy':
      return 50;
    case 'medium':
      return 100;
    case 'hard':
      return 200;
  }
}

export class GitHubIssuesSource implements BountySource {
  readonly name = 'github' as const;
  private config: GitHubIssuesConfig;

  constructor(config: Partial<GitHubIssuesConfig> = {}) {
    this.config = {
      enabled: true,
      repositories: config.repositories || CONTRIBUTION_REPOS,
      contributionLabels: config.contributionLabels || CONTRIBUTION_LABELS,
      excludeLabels: config.excludeLabels || BOUNTY_LABELS,
      token: config.token || process.env.GITHUB_TOKEN,
    };
  }

  private async fetchWithAuth(url: string): Promise<Response> {
    // Use centralized auth (GitHub App > PAT > unauthenticated)
    // GitHub App provides 15,000+ req/hr vs 5,000 with PAT
    const { getGitHubAuthHeaderAsync } = await import('../github-app-auth');

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // Get auth header asynchronously to ensure we try to fetch installation token
    const authHeader = await getGitHubAuthHeaderAsync();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Allow config token to override if explicitly set
    if (this.config.token && !authHeader) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    return fetch(url, { headers });
  }

  /**
   * Fetch contribution issues from a single repository
   */
  private async fetchFromRepo(repo: string): Promise<RawBounty[]> {
    const issues: RawBounty[] = [];
    const seenIssues = new Set<number>();

    // Fetch issues for each contribution label
    for (const label of this.config.contributionLabels) {
      const query = encodeURIComponent(`repo:${repo} is:issue is:open label:"${label}"`);
      const url = `${GITHUB_API_BASE}/search/issues?q=${query}&per_page=30&sort=updated`;

      try {
        const response = await this.fetchWithAuth(url);

        if (!response.ok) {
          if (response.status === 403) {
            console.warn(`[github-issues] Rate limit hit for ${repo}`);
            return issues;
          }
          continue;
        }

        const data: GitHubSearchResponse = await response.json();

        for (const issue of data.items) {
          if (seenIssues.has(issue.number)) continue;

          // Skip issues that have bounty labels
          const hasBountyLabel = issue.labels.some((l) =>
            this.config.excludeLabels.some((bl) => l.name.toLowerCase() === bl.toLowerCase())
          );
          if (hasBountyLabel) continue;

          seenIssues.add(issue.number);

          issues.push({
            source: 'github',
            externalId: `github-issue-${repo}-${issue.number}`,
            externalUrl: issue.html_url,
            title: issue.title,
            description: issue.body || '',
            ownerExternalId: issue.user.login,
            ownerName: issue.user.login,
            labels: issue.labels.map((l) => l.name),
            createdAt: new Date(issue.created_at),
            updatedAt: new Date(issue.updated_at),
            deadline: issue.milestone?.due_on ? new Date(issue.milestone.due_on) : undefined,
            raw: issue,
          });
        }

        // GitHub Search API has 30 req/min secondary limit - need ~2s between requests
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[github-issues] Error fetching from ${repo}:`, error);
      }
    }

    return issues;
  }

  /**
   * Fetch issues from all configured repositories
   */
  async fetch(): Promise<RawBounty[]> {
    if (!this.config.enabled) {
      return [];
    }

    const allIssues: RawBounty[] = [];
    const repos = this.config.repositories;

    // Process 1 repo at a time to respect GitHub Search API's 30 req/min limit
    // Each repo makes 8 label queries at 2s each = 16s per repo
    const BATCH_SIZE = 1;
    const BATCH_DELAY_MS = 2000;

    for (let i = 0; i < repos.length; i += BATCH_SIZE) {
      const batch = repos.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(repos.length / BATCH_SIZE);

      console.log(`[github-issues] Batch ${batchNum}/${totalBatches}: ${batch.join(', ')}`);

      const batchResults = await Promise.all(batch.map((repo) => this.fetchFromRepo(repo)));

      for (const issues of batchResults) {
        allIssues.push(...issues);
      }

      if (i + BATCH_SIZE < repos.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    return allIssues;
  }

  /**
   * Normalize a raw GitHub issue into a ClawFreelance task
   */
  normalize(raw: RawBounty): NormalizedTask {
    const labels = raw.labels || [];
    const labelObjects = labels.map((name) => ({ name }));
    const difficulty = inferDifficulty(labelObjects, raw.description);

    return {
      title: raw.title,
      description: raw.description,
      type: 'code_contribution', // These are contributions, not bounties
      source: 'github',
      externalUrl: raw.externalUrl,
      ownerExternalId: raw.ownerExternalId,
      rewardType: 'points', // Points for non-bounty contributions
      rewardAmount: calculatePoints(difficulty),
      rewardCurrency: undefined,
      visibility: 'public',
      isMilestoneBased: false,
      status: 'open',
      verificationMethod: 'pr_merged',
      difficulty,
      requirements: extractRequirements(labelObjects),
      deadline: raw.deadline,
    };
  }
}

/**
 * Create a GitHub issues source for contribution opportunities
 */
export function createGitHubIssuesSource(customRepos?: string[]): GitHubIssuesSource {
  return new GitHubIssuesSource({
    token: process.env.GITHUB_TOKEN,
    repositories: customRepos || CONTRIBUTION_REPOS,
  });
}
