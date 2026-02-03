/**
 * GitHub Issues Bounty Fetcher
 *
 * Fetches issues from GitHub repositories that are labeled as bounties.
 * Supports configurable repositories and bounty label detection.
 *
 * ## Rate Limits
 *
 * | Auth Method          | Requests/Hour | Notes                           |
 * |---------------------|---------------|----------------------------------|
 * | Unauthenticated     | 60            | Very limited, dev only          |
 * | Personal Access Token| 5,000         | Good for small-medium scale     |
 * | GitHub App          | 15,000+       | Recommended for production      |
 *
 * For production deployments, create a GitHub App:
 * 1. Go to GitHub Settings > Developer Settings > GitHub Apps
 * 2. Create new app with "Read-only" access to:
 *    - Repository contents
 *    - Issues
 *    - Metadata
 * 3. Install on target organization/repos
 * 4. Use App authentication (JWT + installation token)
 *
 * @see https://docs.github.com/en/apps/creating-github-apps
 * @see https://docs.github.com/en/rest/rate-limit
 */

import type { BountySource, GitHubSourceConfig, NormalizedTask, RawBounty } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

// Common bounty label patterns (case-insensitive matching)
const DEFAULT_BOUNTY_LABELS = [
  'bounty',
  'help wanted',
  'good first issue',
  'paid',
  'reward',
  'External', // Used by Expensify and others
  'money',
  'gitcoin',
  'funding',
];

// Well-known repositories with bounty/contribution programs
// Organized by category for easier maintenance
export const POPULAR_BOUNTY_REPOS = [
  // === Web3 / Blockchain ===
  'ethereum/go-ethereum',
  'bitcoin/bitcoin',
  'solana-labs/solana',
  'aptos-labs/aptos-core',
  'NomicFoundation/hardhat',
  'foundry-rs/foundry',
  'paradigmxyz/reth',
  'matter-labs/zksync-era',
  'scroll-tech/scroll',
  'starkware-libs/cairo',
  'noir-lang/noir',
  'zcash/zcash',
  'cosmos/cosmos-sdk',
  'polkadot-fellows/runtimes',

  // === AI / ML ===
  'anthropics/claude-cookbooks',
  'langchain-ai/langchain',
  'huggingface/transformers',
  'ollama/ollama',
  'ggml-org/llama.cpp',
  'livekit/agents',

  // === Open Source Applications (cal.com ecosystem) ===
  'calcom/cal.com',
  'twentyhq/twenty',
  'AppFlowy-IO/AppFlowy',
  'documenso/documenso',
  'formbricks/formbricks',
  'triggerdotdev/trigger.dev',
  'infisical/infisical',
  'dubinc/dub',
  'hoppscotch/hoppscotch',
  'nocodb/nocodb',
  'n8n-io/n8n',
  'plausible/analytics',
  'PostHog/posthog',
  'supabase/supabase',

  // === Developer Tools ===
  'vercel/next.js',
  'remix-run/remix',
  'sveltejs/svelte',
  'vuejs/core',
  'withastro/astro',
  'tauri-apps/tauri',
  'denoland/deno',
  'biomejs/biome',
  'oxc-project/oxc',
  'evanw/esbuild',
  'vitejs/vite',
  'vercel/turborepo',

  // === Infrastructure / DevOps ===
  'docker/compose',
  'kubernetes/kubernetes',
  'hashicorp/terraform',
  'grafana/grafana',
  'prometheus/prometheus',
  'traefik/traefik',
  'containers/podman',

  // === Databases ===
  'cockroachdb/cockroach',
  'pingcap/tidb',
  'questdb/questdb',
  'surrealdb/surrealdb',
  'drizzle-team/drizzle-orm',
  'prisma/prisma',

  // === Security / Privacy ===
  'zama-ai/tfhe-rs',
  'bitwarden/clients',

  // === Paid Contribution Programs ===
  'Expensify/App',
  'rudderlabs/rudder-server',
  'golemcloud/golem-cli',
  'zio/zio',
  'omnigres/omnigres',
  'Mudlet/Mudlet',
  'ether/etherpad-lite',

  // === Algora Active Bounties ===
  'zio/zio-blocks',
  'archestra-ai/archestra',
  'golemcloud/golem-ai',
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

/**
 * Extracts reward amount from issue title, body, or labels
 * Looks for patterns like "$100", "[$250]", "100 USD", "0.1 ETH", etc.
 */
function extractReward(
  title: string,
  body: string | null,
  labels: Array<{ name: string }>
): { amount: number; currency: string } | null {
  // Check title first for bracket patterns like [$250] (used by Expensify)
  const titleMatch = title.match(/\[\$(\d+(?:,\d{3})*)\]/);
  if (titleMatch) {
    return {
      amount: parseFloat(titleMatch[1].replace(/,/g, '')),
      currency: 'USD',
    };
  }

  // Check labels for explicit reward amounts
  for (const label of labels) {
    const labelMatch = label.name.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(USD|USDC|ETH|BTC)?/i);
    if (labelMatch) {
      return {
        amount: parseFloat(labelMatch[1].replace(/,/g, '')),
        currency: labelMatch[2]?.toUpperCase() || 'USD',
      };
    }
  }

  if (!body) return null;

  // Patterns to match in body (crypto first since they're more specific)
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(ETH|BTC|SOL)/i,
    /reward[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(USD|USDC|USDT)?/i,
    /bounty[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(USD|USDC|USDT)?/i,
    /\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(USD|USDC|USDT)?/i,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      return {
        amount: parseFloat(match[1].replace(/,/g, '')),
        currency: match[2]?.toUpperCase() || 'USD',
      };
    }
  }

  return null;
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
      ['good first issue', 'beginner', 'easy', 'starter', 'trivial'].includes(l)
    )
  ) {
    return 'easy';
  }

  if (labelNames.some((l) => ['hard', 'difficult', 'complex', 'expert', 'advanced'].includes(l))) {
    return 'hard';
  }

  // Check body for complexity indicators
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

  // Language/tech requirements
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
  ];
  for (const tech of techLabels) {
    if (labelNames.some((l) => l.includes(tech))) {
      requirements.push(tech);
    }
  }

  // Area requirements
  if (labelNames.some((l) => l.includes('frontend'))) {
    requirements.push('frontend');
  }
  if (labelNames.some((l) => l.includes('backend'))) {
    requirements.push('backend');
  }
  if (labelNames.some((l) => l.includes('smart contract'))) {
    requirements.push('smart-contracts');
  }
  if (labelNames.some((l) => l.includes('documentation') || l.includes('docs'))) {
    requirements.push('documentation');
  }
  if (labelNames.some((l) => l.includes('test'))) {
    requirements.push('testing');
  }

  return requirements;
}

export class GitHubBountySource implements BountySource {
  readonly name = 'github' as const;
  private config: GitHubSourceConfig;

  constructor(config: Partial<GitHubSourceConfig> = {}) {
    this.config = {
      enabled: true,
      repositories: config.repositories || POPULAR_BOUNTY_REPOS,
      bountyLabels: config.bountyLabels || DEFAULT_BOUNTY_LABELS,
      token: config.token || process.env.GITHUB_TOKEN,
      ...config,
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
   * Fetch bounty issues from a single repository
   * Makes separate requests per label to avoid GitHub search API limitations
   */
  private async fetchFromRepo(repo: string): Promise<RawBounty[]> {
    const bounties: RawBounty[] = [];
    const seenIssues = new Set<number>();

    // Fetch issues for each bounty label separately
    // GitHub search doesn't support OR for multiple labels well
    for (const label of this.config.bountyLabels) {
      const query = encodeURIComponent(`repo:${repo} is:issue is:open label:"${label}"`);
      const url = `${GITHUB_API_BASE}/search/issues?q=${query}&per_page=50&sort=updated`;

      try {
        const response = await this.fetchWithAuth(url);

        if (!response.ok) {
          const text = await response.text();
          if (response.status === 403) {
            console.warn(`GitHub rate limit hit for ${repo} (${label}): ${text.slice(0, 100)}`);
            return bounties; // Return what we have so far
          }
          console.warn(
            `GitHub API error for ${repo} (${label}): ${response.status} - ${text.slice(0, 100)}`
          );
          continue; // Skip this label, try next
        }

        const data: GitHubSearchResponse = await response.json();

        for (const issue of data.items) {
          // Deduplicate issues that match multiple labels
          if (seenIssues.has(issue.number)) {
            continue;
          }
          seenIssues.add(issue.number);

          bounties.push({
            source: 'github',
            externalId: `github-${repo}-${issue.number}`,
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
        console.error(`Error fetching ${label} from ${repo}:`, error);
      }
    }

    return bounties;
  }

  /**
   * Fetch bounties from all configured repositories
   * Uses batched parallel fetching to optimize speed while respecting rate limits
   */
  async fetch(): Promise<RawBounty[]> {
    if (!this.config.enabled) {
      return [];
    }

    const allBounties: RawBounty[] = [];
    const repos = this.config.repositories;

    // Process 1 repo at a time to respect GitHub Search API's 30 req/min limit
    // Each repo makes up to 9 requests (one per label) at 2s each = 18s per repo
    const BATCH_SIZE = 1;
    const BATCH_DELAY_MS = 2000;

    for (let i = 0; i < repos.length; i += BATCH_SIZE) {
      const batch = repos.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(repos.length / BATCH_SIZE);

      console.log(`[github] Batch ${batchNum}/${totalBatches}: ${batch.join(', ')}`);

      // Fetch batch in parallel
      const batchResults = await Promise.all(batch.map((repo) => this.fetchFromRepo(repo)));

      // Collect results
      for (const bounties of batchResults) {
        allBounties.push(...bounties);
      }

      // Delay between batches (except for last batch)
      if (i + BATCH_SIZE < repos.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    return allBounties;
  }

  /**
   * Normalize a raw GitHub bounty into a ClawFreelance task
   */
  normalize(raw: RawBounty): NormalizedTask {
    const labels = raw.labels || [];
    const labelObjects = labels.map((name) => ({ name }));
    const reward = extractReward(raw.title, raw.description, labelObjects);

    return {
      title: raw.title,
      description: raw.description,
      type: 'bounty',
      source: 'github',
      externalUrl: raw.externalUrl,
      ownerExternalId: raw.ownerExternalId,
      rewardType: reward ? 'external' : 'points',
      rewardAmount: reward?.amount || 0,
      rewardCurrency: reward?.currency,
      visibility: 'public',
      isMilestoneBased: false,
      status: 'open',
      verificationMethod: 'pr_merged',
      difficulty: inferDifficulty(labelObjects, raw.description),
      requirements: extractRequirements(labelObjects),
      deadline: raw.deadline,
    };
  }
}

/**
 * Create a GitHub source with environment-based configuration
 */
export function createGitHubSource(customRepos?: string[]): GitHubBountySource {
  return new GitHubBountySource({
    token: process.env.GITHUB_TOKEN,
    repositories: customRepos || POPULAR_BOUNTY_REPOS,
  });
}
