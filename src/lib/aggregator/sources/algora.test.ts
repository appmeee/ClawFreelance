import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AlgoraBountySource } from './algora';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AlgoraBountySource API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch bounties directly from Algora API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'bty_123',
            title: 'Fix issue',
            html_url: 'https://github.com/test',
            org: 'TestOrg',
            reward: { amount_usd: '150' }
          }
        ]
      })
    });

    const source = new AlgoraBountySource();
    const result = await source.fetch();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://console.algora.io/api/bounties?status=open&limit=50',
      expect.any(Object)
    );
    expect(result).toHaveLength(1);
    expect(result[0].rewardAmount).toBe(150);
  });

  it('should normalize correctly', () => {
    const source = new AlgoraBountySource();
    const raw = {
      source: 'algora' as const,
      externalId: 'test-1',
      externalUrl: 'https://test',
      title: 'Test',
      description: 'Desc',
      ownerExternalId: 'user',
      labels: [],
      rewardAmount: 50,
      createdAt: new Date(),
      raw: {},
    };

    const normalized = source.normalize(raw);
    expect(normalized.rewardType).toBe('external');
    expect(normalized.rewardAmount).toBe(50);
  });
});
