/**
 * Bugcrowd Bug Bounty Source (Stub)
 *
 * Bugcrowd requires API authentication to access program data and bounty amounts.
 * To enable this source:
 *
 * 1. Create a Bugcrowd researcher account at https://bugcrowd.com
 * 2. Request API access through their platform
 * 3. Set environment variables:
 *    - BUGCROWD_API_TOKEN
 *
 * Note: Bugcrowd's API access may be limited to specific partners/researchers.
 *
 * @see https://bugcrowd.com/programs
 */

import type { BountySource, NormalizedTask, RawBounty } from '../types';

interface BugcrowdSourceConfig {
  enabled: boolean;
  token?: string;
  maxPrograms?: number;
}

export class BugcrowdBountySource implements BountySource {
  readonly name = 'bugcrowd' as const;
  private config: BugcrowdSourceConfig;

  constructor(config: Partial<BugcrowdSourceConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      token: config.token || process.env.BUGCROWD_API_TOKEN,
      maxPrograms: config.maxPrograms ?? 100,
    };
  }

  private isConfigured(): boolean {
    return !!this.config.token;
  }

  async fetch(): Promise<RawBounty[]> {
    if (!this.config.enabled) {
      return [];
    }

    if (!this.isConfigured()) {
      console.log('[bugcrowd] Source not configured - set BUGCROWD_API_TOKEN');
      return [];
    }

    // TODO: Implement Bugcrowd API integration
    console.log(
      '[bugcrowd] API integration pending - credentials configured but fetch not implemented'
    );
    return [];
  }

  normalize(raw: RawBounty): NormalizedTask {
    return {
      title: raw.title,
      description: raw.description,
      type: 'bounty',
      source: 'bugcrowd',
      externalUrl: raw.externalUrl,
      ownerExternalId: raw.ownerExternalId,
      rewardType: 'external',
      rewardAmount: raw.rewardAmount || 0,
      rewardCurrency: 'USD',
      visibility: 'public',
      isMilestoneBased: false,
      status: 'open',
      verificationMethod: 'owner_approval',
      difficulty: 'medium',
      requirements: ['security-research'],
      deadline: undefined,
    };
  }
}

export function createBugcrowdSource(config?: Partial<BugcrowdSourceConfig>): BugcrowdBountySource {
  return new BugcrowdBountySource(config);
}
