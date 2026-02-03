/**
 * Immunefi Bug Bounty Source
 *
 * Fetches security bounty programs from Immunefi via the unofficial
 * GitHub repository that tracks program data.
 *
 * Immunefi is the leading Web3 bug bounty platform with $190B+ in protected value.
 * Bounties range from $1K to $10M+ for critical vulnerabilities.
 *
 * @see https://immunefi.com/bug-bounty/
 * @see https://github.com/infosec-us-team/Immunefi-Bug-Bounty-Programs-Unofficial
 */

import type { BountySource, NormalizedTask, RawBounty } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';
const IMMUNEFI_REPO = 'infosec-us-team/Immunefi-Bug-Bounty-Programs-Unofficial';
const RAW_CONTENT_BASE = `https://raw.githubusercontent.com/${IMMUNEFI_REPO}/main/project`;

interface ImmunefiProgram {
  project: string;
  slug: string;
  maxBounty: number;
  description: string;
  launchDate: string;
  updatedDate: string;
  websiteUrl?: string;
  githubUrl?: string;
  ecosystem?: string;
  productType?: string;
  programType?: string;
  kyc?: boolean;
  inviteOnly?: boolean;
}

interface ImmunefiSourceConfig {
  enabled: boolean;
  maxPrograms?: number;
  minBounty?: number;
}

export class ImmunefiBountySource implements BountySource {
  readonly name = 'immunefi' as const;
  private config: ImmunefiSourceConfig;

  constructor(config: Partial<ImmunefiSourceConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      maxPrograms: config.maxPrograms ?? 100, // Limit to top programs
      minBounty: config.minBounty ?? 10000, // $10K minimum
    };
  }

  private async fetchWithAuth(url: string): Promise<Response> {
    const { getGitHubAuthHeaderAsync } = await import('../github-app-auth');

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    const authHeader = await getGitHubAuthHeaderAsync();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    return fetch(url, { headers });
  }

  /**
   * Get list of program JSON files from the unofficial repo
   */
  private async getProgramList(): Promise<string[]> {
    const url = `${GITHUB_API_BASE}/repos/${IMMUNEFI_REPO}/contents/project`;
    const response = await this.fetchWithAuth(url);

    if (!response.ok) {
      console.error('[immunefi] Failed to fetch program list:', response.status);
      return [];
    }

    const files = await response.json();
    return files
      .filter((f: { name: string }) => f.name.endsWith('.json'))
      .map((f: { name: string }) => f.name.replace('.json', ''));
  }

  /**
   * Fetch a single program's data
   */
  private async fetchProgram(slug: string): Promise<ImmunefiProgram | null> {
    const url = `${RAW_CONTENT_BASE}/${slug}.json`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      return await response.json();
    } catch {
      return null;
    }
  }

  async fetch(): Promise<RawBounty[]> {
    if (!this.config.enabled) {
      return [];
    }

    console.log('[immunefi] Fetching program list...');
    const programSlugs = await this.getProgramList();
    console.log(
      `[immunefi] Found ${programSlugs.length} programs, fetching top ${this.config.maxPrograms}...`
    );

    const bounties: RawBounty[] = [];
    let fetched = 0;

    // Fetch programs in batches to respect rate limits
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 1000;

    for (
      let i = 0;
      i < programSlugs.length && fetched < (this.config.maxPrograms || 100);
      i += BATCH_SIZE
    ) {
      const batch = programSlugs.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(batch.map((slug) => this.fetchProgram(slug)));

      for (const program of results) {
        if (!program) continue;
        if (!program.slug || !program.project) continue; // Skip invalid programs
        if (program.inviteOnly) continue; // Skip invite-only programs
        if (program.maxBounty < (this.config.minBounty || 10000)) continue;

        bounties.push({
          source: 'immunefi',
          externalId: `immunefi-${program.slug}`,
          externalUrl: `https://immunefi.com/bug-bounty/${program.slug}`,
          title: `${program.project} Bug Bounty`,
          description: program.description || `Security bug bounty for ${program.project}`,
          ownerExternalId: program.slug,
          ownerName: program.project,
          rewardAmount: program.maxBounty,
          rewardCurrency: 'USD',
          labels: [
            'security',
            'bug-bounty',
            program.ecosystem || 'web3',
            program.productType || 'smart-contract',
          ].filter(Boolean),
          createdAt: new Date(program.launchDate),
          updatedAt: program.updatedDate ? new Date(program.updatedDate) : undefined,
          raw: program,
        });

        fetched++;
      }

      // Delay between batches
      if (i + BATCH_SIZE < programSlugs.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    console.log(`[immunefi] Fetched ${bounties.length} bounties (min $${this.config.minBounty})`);
    return bounties;
  }

  normalize(raw: RawBounty): NormalizedTask {
    return {
      title: raw.title,
      description: raw.description,
      type: 'bounty',
      source: 'immunefi',
      externalUrl: raw.externalUrl,
      ownerExternalId: raw.ownerExternalId,
      rewardType: 'external',
      rewardAmount: raw.rewardAmount || 0,
      rewardCurrency: raw.rewardCurrency || 'USD',
      visibility: 'public',
      isMilestoneBased: false,
      status: 'open',
      verificationMethod: 'owner_approval', // Security bounties need manual verification
      difficulty: this.getDifficulty(raw.rewardAmount || 0),
      requirements: ['security-research', 'smart-contract-audit'],
      deadline: undefined,
    };
  }

  private getDifficulty(maxBounty: number): 'easy' | 'medium' | 'hard' {
    if (maxBounty >= 100000) return 'hard';
    if (maxBounty >= 25000) return 'medium';
    return 'easy';
  }
}

export function createImmunefiSource(config?: Partial<ImmunefiSourceConfig>): ImmunefiBountySource {
  return new ImmunefiBountySource(config);
}
