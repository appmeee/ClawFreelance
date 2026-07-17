/**
 * Algora Bounty Fetcher
 *
 * Algora bounties are created on GitHub issues via `/bounty $X` comments.
 * This source fetches real bounties from Algora.io's API directly.
 */

import type { BountySource, NormalizedTask, RawBounty } from '../types';

interface AlgoraAPIBounty {
  id: string;
  url: string;
  html_url: string;
  title: string;
  status: string;
  org: string;
  reward?: {
    amount: number;
    amount_usd: string;
    currency: string;
  };
  amount_usd?: number;
}

interface AlgoraSourceConfig {
  enabled: boolean;
  repositories?: string[];
  token?: string;
}

export class AlgoraBountySource implements BountySource {
  readonly name = 'algora' as const;
  private config: AlgoraSourceConfig;

  constructor(config: Partial<AlgoraSourceConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      token: config.token || process.env.GITHUB_TOKEN,
    };
  }

  async fetch(): Promise<RawBounty[]> {
    if (!this.config.enabled) {
      return [];
    }

    const allBounties: RawBounty[] = [];
    const url = 'https://console.algora.io/api/bounties?status=open&limit=50';

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return allBounties;
      }

      const data = await response.json();
      const items: AlgoraAPIBounty[] = Array.isArray(data) ? data : (data.items || data.bounties || []);

      for (const item of items) {
        let rewardAmount = 0;
        const rewardCurrency = 'USD';

        if (item.reward && item.reward.amount_usd) {
          rewardAmount = Number(item.reward.amount_usd);
        } else if (typeof item.amount_usd === 'number') {
          rewardAmount = item.amount_usd;
        }

        allBounties.push({
          source: 'algora',
          externalId: item.id || `algora-${Math.random()}`,
          externalUrl: item.url || item.html_url || '',
          title: item.title || 'Algora Bounty',
          description: `Bounty from ${item.org || 'Algora'}`,
          ownerExternalId: item.org || 'algora',
          ownerName: item.org || 'algora',
          labels: ['bounty', 'algora'],
          rewardAmount: rewardAmount,
          rewardCurrency: rewardCurrency,
          createdAt: new Date(),
          updatedAt: new Date(),
          raw: item,
        });
      }
    } catch (error) {
      console.error(`[algora] Error fetching from API:`, error);
    }

    return allBounties;
  }

  normalize(raw: RawBounty): NormalizedTask {
    const hasReward = (raw.rewardAmount || 0) >= 10;

    return {
      title: raw.title,
      description: raw.description,
      type: 'bounty',
      source: 'algora',
      externalUrl: raw.externalUrl,
      ownerExternalId: raw.ownerExternalId,
      rewardType: hasReward ? 'external' : 'points',
      rewardAmount: raw.rewardAmount || 0,
      rewardCurrency: raw.rewardCurrency || 'USD',
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

export function createAlgoraSource(): AlgoraBountySource {
  return new AlgoraBountySource({
    token: process.env.GITHUB_TOKEN,
  });
}
