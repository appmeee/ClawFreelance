import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchActiveBounties } from './algora-api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Algora API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch active bounties from Algora API', async () => {
    const mockBounty = {
      id: 'bounty_123',
      task: {
        issue: {
          url: 'https://github.com/org/repo/issues/1',
          title: 'Fix the bug',
        },
        repo: {
          full_name: 'org/repo',
        }
      },
      reward: {
        amount: 500,
        currency: 'USD'
      },
      status: 'active'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [mockBounty]
      })
    });

    const bounties = await fetchActiveBounties('org/repo');
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.algora.io/bounties?repo=org/repo')
    );
    expect(bounties).toHaveLength(1);
    expect(bounties[0].id).toBe('bounty_123');
    expect(bounties[0].reward.amount).toBe(500);
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const bounties = await fetchActiveBounties('org/repo');
    expect(bounties).toEqual([]);
  });

  it('should handle network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const bounties = await fetchActiveBounties('org/repo');
    expect(bounties).toEqual([]);
  });
});
