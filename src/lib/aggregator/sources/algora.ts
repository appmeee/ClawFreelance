import type { BountySource, NormalizedTask, RawBounty } from '../types';
import { fetchActiveBounties } from './algora-api';

// Repositories known to use Algora for bounties
export const ALGORA_REPOS = [
  'zio/zio',
  'zio/zio-blocks',
  'golemcloud/golem-cli',
  'golemcloud/golem-ai',
  'omnigres/omnigres',
  'Mudlet/Mudlet',
  'archestra-ai/archestra',
  'ether/etherpad-lite',
];

interface AlgoraSourceConfig {
  enabled: boolean;
  repositories: string[];
}

export class AlgoraBountySource implements BountySource {
  readonly name = 'algora' as const;
  private config: AlgoraSourceConfig;

  constructor(config: Partial<AlgoraSourceConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      repositories: config.repositories || ALGORA_REPOS,
    };
  }

  private async fetchFromRepo(repo: string): Promise<RawBounty[]> {
    const algoraBounties = await fetchActiveBounties(repo);
    return algoraBounties.map(bounty => ({
      source: 'algora',
      externalId: bounty.id,
      externalUrl: bounty.task.issue.url,
      title: bounty.task.issue.title,
      description: '', // We don't need body scraping anymore!
      ownerExternalId: bounty.task.repo.full_name.split('/')[0],
      ownerName: bounty.task.repo.full_name.split('/')[0],
      labels: [], // Not needed for normalization if reward is explicit
      rewardAmount: bounty.reward.amount,
      rewardCurrency: bounty.reward.currency,
      createdAt: new Date(), // Optional, API might provide it
      updatedAt: new Date(),
      raw: bounty as any,
    }));
  }

  async fetch(): Promise<RawBounty[]> {
    if (!this.config.enabled) {
      return [];
    }

    const results = await Promise.allSettled(
      this.config.repositories.map(repo => this.fetchFromRepo(repo))
    );

    return results.flatMap(result => 
      result.status === 'fulfilled' ? result.value : []
    );
  }

  normalize(raw: RawBounty): NormalizedTask {
    const rewardAmount = raw.rewardAmount || 0;
    const rewardCurrency = raw.rewardCurrency || 'USD';
    const hasReward = rewardAmount >= 10;
    const rawData = raw.raw as import('./algora-api').AlgoraBounty;

    let status: 'open' | 'in_progress' | 'completed' = 'open';
    if (rawData?.status) {
      if (rawData.status === 'completed' || rawData.status === 'paid') {
        status = 'completed';
      } else if (rawData.status === 'escrowed') {
        status = 'in_progress';
      }
    }

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
      status,
      verificationMethod: 'pr_merged',
      difficulty: 'medium',
      requirements: [],
      deadline: raw.deadline,
    };
  }
}

export function createAlgoraSource(customRepos?: string[]): AlgoraBountySource {
  return new AlgoraBountySource({
    repositories: customRepos || ALGORA_REPOS,
  });
}
