import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALGORA_REPOS, AlgoraBountySource, createAlgoraSource } from './algora';
import * as algoraApi from './algora-api';

// Mock the API client
vi.mock('./algora-api', () => ({
  fetchActiveBounties: vi.fn(),
}));

describe('AlgoraBountySource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default config when none provided', () => {
      const source = new AlgoraBountySource();
      expect(source.name).toBe('algora');
    });

    it('should accept custom repositories', () => {
      const source = new AlgoraBountySource({
        repositories: ['custom/repo1', 'custom/repo2'],
      });
      expect(source.name).toBe('algora');
    });
  });

  describe('fetch', () => {
    it('should return empty array when disabled', async () => {
      const source = new AlgoraBountySource({ enabled: false });
      const result = await source.fetch();
      expect(result).toEqual([]);
      expect(algoraApi.fetchActiveBounties).not.toHaveBeenCalled();
    });

    it('should fetch Algora bounties from configured repositories', async () => {
      const mockBounty = {
        id: 'bounty_1',
        task: {
          issue: { url: 'https://github.com/zio/zio/issues/1', title: 'Bug' },
          repo: { full_name: 'zio/zio' }
        },
        reward: { amount: 500, currency: 'USD' },
        status: 'active'
      };

      (algoraApi.fetchActiveBounties as any).mockResolvedValue([mockBounty]);

      const source = new AlgoraBountySource({
        repositories: ['zio/zio'],
      });

      const result = await source.fetch();

      expect(algoraApi.fetchActiveBounties).toHaveBeenCalledWith('zio/zio');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        source: 'algora',
        externalId: 'bounty_1',
        externalUrl: 'https://github.com/zio/zio/issues/1',
        title: 'Bug',
        ownerExternalId: 'zio',
        rewardAmount: 500,
        rewardCurrency: 'USD'
      });
    });
  });

  describe('normalize', () => {
    it('should normalize raw Algora bounty to task format', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'bounty_1',
        externalUrl: 'https://github.com/zio/zio/issues/1',
        title: 'Implement new feature',
        description: '',
        ownerExternalId: 'zio',
        ownerName: 'zio',
        labels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        rewardAmount: 500,
        rewardCurrency: 'USD',
        raw: { status: 'active' },
      };

      const normalized = source.normalize(raw);

      expect(normalized).toMatchObject({
        title: 'Implement new feature',
        type: 'bounty',
        source: 'algora',
        externalUrl: 'https://github.com/zio/zio/issues/1',
        ownerExternalId: 'zio',
        rewardType: 'external',
        rewardAmount: 500,
        rewardCurrency: 'USD',
        visibility: 'public',
        status: 'open',
        verificationMethod: 'pr_merged',
        difficulty: 'medium',
      });
    });

    it('should normalize completed status', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'bounty_1',
        externalUrl: 'https://github.com/zio/zio/issues/1',
        title: 'Test',
        description: '',
        ownerExternalId: 'zio',
        ownerName: 'zio',
        labels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        rewardAmount: 500,
        rewardCurrency: 'USD',
        raw: { status: 'paid' },
      };

      const normalized = source.normalize(raw);
      expect(normalized.status).toBe('completed');
    });
  });

  describe('createAlgoraSource factory', () => {
    it('should create source with default repos', () => {
      const source = createAlgoraSource();
      expect(source.name).toBe('algora');
    });

    it('should create source with custom repos', () => {
      const source = createAlgoraSource(['custom/repo1', 'custom/repo2']);
      expect(source.name).toBe('algora');
    });
  });
});
