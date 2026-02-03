/**
 * Gitcoin Bounty Source (Stub)
 *
 * NOTE: Gitcoin has evolved significantly:
 * - Original bounties platform has been sunset
 * - Current focus is on Grants and Passport
 * - Allo Protocol is the new funding infrastructure
 *
 * This is a stub implementation. Full integration would require:
 * 1. Gitcoin Passport verification (for sybil resistance)
 * 2. Allo Protocol integration for grants
 * 3. Understanding of grant rounds and matching pools
 *
 * For now, bounties come primarily from GitHub sources that were
 * originally funded through Gitcoin.
 *
 * @see https://www.gitcoin.co/
 * @see https://docs.allo.gitcoin.co/
 */

import type { BountySource, NormalizedTask, RawBounty } from '../types';

interface GitcoinSourceConfig {
  enabled: boolean;
  apiKey?: string;
  networks?: string[];
}

export class GitcoinBountySource implements BountySource {
  readonly name = 'gitcoin' as const;
  private config: GitcoinSourceConfig;

  constructor(config: Partial<GitcoinSourceConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? false, // Disabled by default until full implementation
      apiKey: config.apiKey || process.env.GITCOIN_API_KEY,
      networks: config.networks || ['mainnet', 'optimism', 'arbitrum'],
    };
  }

  /**
   * Fetch bounties from Gitcoin
   *
   * TODO: Implement when Gitcoin API access is available
   * This would involve:
   * 1. Authenticating with Gitcoin Passport
   * 2. Querying Allo Protocol for active grants/bounties
   * 3. Normalizing grant data to our bounty format
   */
  async fetch(): Promise<RawBounty[]> {
    if (!this.config.enabled) {
      console.log('[gitcoin] Source disabled - Gitcoin integration pending');
      return [];
    }

    if (!this.config.apiKey) {
      console.warn('[gitcoin] No API key configured');
      return [];
    }

    // Placeholder for future implementation
    console.log('[gitcoin] Full Gitcoin integration coming soon');
    return [];
  }

  /**
   * Normalize Gitcoin bounty data to our task format
   */
  normalize(raw: RawBounty): NormalizedTask {
    return {
      title: raw.title,
      description: raw.description,
      type: 'bounty',
      source: 'gitcoin',
      externalUrl: raw.externalUrl,
      ownerExternalId: raw.ownerExternalId,
      rewardType: raw.rewardAmount ? 'crypto' : 'points',
      rewardAmount: raw.rewardAmount || 0,
      rewardCurrency: raw.rewardCurrency || 'ETH',
      visibility: 'public',
      isMilestoneBased: false,
      status: 'open',
      verificationMethod: 'pr_merged',
      difficulty: 'medium',
      requirements: [],
      deadline: raw.deadline,
    };
  }
}

export function createGitcoinSource(): GitcoinBountySource {
  return new GitcoinBountySource({
    apiKey: process.env.GITCOIN_API_KEY,
  });
}
