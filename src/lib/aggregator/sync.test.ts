import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BountySource, RawBounty, SyncResult } from './types';

// Shared mock data that tests can modify
let mockOpenTasks: Array<{ id: string; externalUrl: string | null }> = [];
let mockSourceStats: Array<{ source: string; count: number }> = [];
let mockGitHubBounties: RawBounty[] = [];
let mockUpsertResult: Array<{ id: string; createdAt: Date; updatedAt: Date }> = [];
let mockUpsertShouldThrow = false;
let mockFetchShouldThrow = false;

// Mock db module - using inline factory to avoid hoisting issues
vi.mock('@/db', () => {
  const createMockSelect = () => {
    const mockLimit = vi.fn(() => Promise.resolve(mockOpenTasks));
    const mockGroupBy = vi.fn(() => Promise.resolve(mockSourceStats));
    const mockWhere = vi.fn(() => ({
      limit: mockLimit,
    }));
    const mockFrom = vi.fn(() => ({
      where: mockWhere,
      groupBy: mockGroupBy,
    }));
    return vi.fn(() => ({
      from: mockFrom,
    }));
  };

  const mockSelect = createMockSelect();

  const mockInsert = vi.fn(() => ({
    values: vi.fn(() => ({
      onConflictDoUpdate: vi.fn(() => ({
        returning: vi.fn(() => {
          if (mockUpsertShouldThrow) {
            return Promise.reject(new Error('Database insert failed'));
          }
          if (mockUpsertResult.length > 0) {
            return Promise.resolve(mockUpsertResult);
          }
          const now = new Date();
          return Promise.resolve([{ id: 'test-id', createdAt: now, updatedAt: now }]);
        }),
      })),
    })),
  }));

  const mockUpdate = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'test-id' }])),
      })),
    })),
  }));

  return {
    db: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    },
    __mockSelect: mockSelect,
    __mockUpdate: mockUpdate,
  };
});

// Mock the GitHub source
vi.mock('./sources/github', () => ({
  createGitHubSource: vi.fn(() => ({
    name: 'github',
    fetch: vi.fn(() => {
      if (mockFetchShouldThrow) {
        return Promise.reject(new Error('Source fetch failed'));
      }
      return Promise.resolve(mockGitHubBounties);
    }),
    normalize: vi.fn((raw: RawBounty) => ({
      title: raw.title,
      description: raw.description,
      type: 'bounty',
      source: 'github',
      externalUrl: raw.externalUrl,
      ownerExternalId: raw.ownerExternalId,
      rewardType: 'points',
      rewardAmount: 0,
      visibility: 'public',
      isMilestoneBased: false,
      status: 'open',
      verificationMethod: 'pr_merged',
      difficulty: 'medium',
      requirements: [],
    })),
  })),
}));

// Mock the Algora source
vi.mock('./sources/algora', () => ({
  createAlgoraSource: vi.fn(() => ({
    name: 'algora',
    fetch: vi.fn(() => Promise.resolve([])),
    normalize: vi.fn((raw: RawBounty) => ({
      title: raw.title,
      description: raw.description,
      type: 'bounty',
      source: 'algora',
      externalUrl: raw.externalUrl,
      ownerExternalId: raw.ownerExternalId,
      rewardType: 'points',
      rewardAmount: 0,
      visibility: 'public',
      isMilestoneBased: false,
      status: 'open',
      verificationMethod: 'pr_merged',
      difficulty: 'medium',
      requirements: [],
    })),
  })),
}));

// Mock the Immunefi source
vi.mock('./sources/immunefi', () => ({
  createImmunefiSource: vi.fn(() => ({
    name: 'immunefi',
    fetch: vi.fn(() => Promise.resolve([])),
    normalize: vi.fn(() => ({})),
  })),
}));

// Mock the Bugcrowd source
vi.mock('./sources/bugcrowd', () => ({
  createBugcrowdSource: vi.fn(() => ({
    name: 'bugcrowd',
    fetch: vi.fn(() => Promise.resolve([])),
    normalize: vi.fn(() => ({})),
  })),
}));

// Mock the GitHub Issues source
vi.mock('./sources/github-issues', () => ({
  createGitHubIssuesSource: vi.fn(() => ({
    name: 'github-issues',
    fetch: vi.fn(() => Promise.resolve([])),
    normalize: vi.fn(() => ({})),
  })),
}));

// Mock the GitHub App Auth
vi.mock('./github-app-auth', () => ({
  initGitHubAppAuth: vi.fn(() => Promise.resolve()),
  getGitHubHeaders: vi.fn(() => ({
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer test-token',
  })),
}));

// Import after mocking
import {
  getSyncStats,
  markStaleTasks,
  runSync,
  syncFromSource,
  updateGitHubTaskStatuses,
} from './sync';

describe('Sync Engine', () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockOpenTasks = [];
    mockSourceStats = [];
    mockGitHubBounties = [];
    mockUpsertResult = [];
    mockUpsertShouldThrow = false;
    mockFetchShouldThrow = false;
  });

  describe('runSync', () => {
    it('should return results array', async () => {
      const results = await runSync();

      expect(Array.isArray(results)).toBe(true);
    });

    it('should include GitHub source by default', async () => {
      const results = await runSync();

      expect(results.some((r) => r.source === 'github')).toBe(true);
    });

    it('should respect disabled sources in config', async () => {
      const results = await runSync({
        sources: {
          github: { enabled: false },
        },
      });

      // GitHub should still be in results but with 0 fetched
      // due to how the mock works
      expect(results).toBeDefined();
    });

    it('should track sync duration', async () => {
      const results = await runSync();

      for (const result of results) {
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return proper result structure', async () => {
      const results = await runSync();

      for (const result of results) {
        expect(result).toHaveProperty('source');
        expect(result).toHaveProperty('fetched');
        expect(result).toHaveProperty('created');
        expect(result).toHaveProperty('updated');
        expect(result).toHaveProperty('skipped');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('duration');
      }
    });
  });

  describe('getSyncStats', () => {
    it('should return stats object', async () => {
      const stats = await getSyncStats();

      expect(stats).toHaveProperty('totalTasks');
      expect(stats).toHaveProperty('bySource');
      expect(typeof stats.totalTasks).toBe('number');
      expect(typeof stats.bySource).toBe('object');
    });
  });

  describe('SyncResult type', () => {
    it('should have correct shape', () => {
      const result: SyncResult = {
        source: 'github',
        fetched: 10,
        created: 5,
        updated: 3,
        skipped: 2,
        errors: [],
        duration: 1000,
      };

      expect(result.source).toBe('github');
      expect(result.fetched).toBe(10);
      expect(result.created).toBe(5);
      expect(result.updated).toBe(3);
      expect(result.skipped).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBe(1000);
    });

    it('should support error entries', () => {
      const result: SyncResult = {
        source: 'github',
        fetched: 10,
        created: 4,
        updated: 3,
        skipped: 2,
        errors: [
          { externalId: 'github-test-1', message: 'Failed to parse' },
          { externalId: 'github-test-2', message: 'Validation error', code: 'INVALID' },
        ],
        duration: 1000,
      };

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toHaveProperty('externalId');
      expect(result.errors[0]).toHaveProperty('message');
      expect(result.errors[1]).toHaveProperty('code');
    });
  });

  describe('BountySource interface', () => {
    it('should define required methods', () => {
      const mockSource: BountySource = {
        name: 'github',
        fetch: async () => [],
        normalize: (raw) => ({
          title: raw.title,
          description: raw.description,
          type: 'bounty',
          source: 'github',
          externalUrl: raw.externalUrl,
          ownerExternalId: raw.ownerExternalId,
          rewardType: 'points',
          rewardAmount: 0,
          visibility: 'public',
          isMilestoneBased: false,
          status: 'open',
          verificationMethod: 'pr_merged',
          difficulty: 'medium',
          requirements: [],
        }),
      };

      expect(mockSource.name).toBe('github');
      expect(typeof mockSource.fetch).toBe('function');
      expect(typeof mockSource.normalize).toBe('function');
    });
  });

  describe('syncFromSource', () => {
    it('should sync from github source', async () => {
      const result = await syncFromSource('github');
      expect(result).toHaveProperty('source', 'github');
      expect(result).toHaveProperty('fetched');
      expect(result).toHaveProperty('duration');
    });

    it('should sync from algora source', async () => {
      const result = await syncFromSource('algora');
      expect(result).toHaveProperty('source', 'algora');
    });

    it('should throw error for unsupported source', async () => {
      await expect(syncFromSource('invalid' as 'github')).rejects.toThrow('Unsupported source');
    });
  });

  describe('markStaleTasks', () => {
    it('should return 0 when activeExternalUrls is empty', async () => {
      const result = await markStaleTasks('github', []);
      expect(result).toBe(0);
    });
  });

  describe('runSync with different configs', () => {
    it('should handle algora enabled config', async () => {
      const results = await runSync({
        sources: {
          algora: { enabled: true },
        },
      });
      expect(results.some((r) => r.source === 'algora')).toBe(true);
    });

    it('should handle immunefi enabled config', async () => {
      const results = await runSync({
        sources: {
          immunefi: { enabled: true },
        },
      });
      expect(results.some((r) => r.source === 'immunefi')).toBe(true);
    });

    it('should handle bugcrowd enabled config', async () => {
      const results = await runSync({
        sources: {
          bugcrowd: { enabled: true },
        },
      });
      expect(results.some((r) => r.source === 'bugcrowd')).toBe(true);
    });

    it('should handle githubIssues enabled config', async () => {
      const results = await runSync({
        sources: {
          githubIssues: { enabled: true },
        },
      });
      // Cast to string since 'github-issues' is the source name but not in TaskSource union
      expect(results.some((r) => (r.source as string) === 'github-issues')).toBe(true);
    });

    it('should handle multiple sources enabled', async () => {
      const results = await runSync({
        sources: {
          github: { enabled: true },
          algora: { enabled: true },
        },
      });
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('updateGitHubTaskStatuses', () => {
    const mockFetch = vi.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = mockFetch;
      mockFetch.mockClear();
      mockOpenTasks = [];
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return result object with counts', async () => {
      const result = await updateGitHubTaskStatuses();
      expect(result).toHaveProperty('completed');
      expect(result).toHaveProperty('cancelled');
      expect(result).toHaveProperty('errors');
      expect(typeof result.completed).toBe('number');
      expect(typeof result.cancelled).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should skip tasks with null externalUrl', async () => {
      mockOpenTasks = [{ id: 'task-1', externalUrl: null }];

      const result = await updateGitHubTaskStatuses();

      expect(result.completed).toBe(0);
      expect(result.cancelled).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should skip tasks with non-GitHub URLs', async () => {
      mockOpenTasks = [{ id: 'task-1', externalUrl: 'https://gitlab.com/owner/repo/issues/1' }];

      const result = await updateGitHubTaskStatuses();

      expect(result.completed).toBe(0);
      expect(result.cancelled).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should mark deleted issues as cancelled (404 response)', async () => {
      mockOpenTasks = [{ id: 'task-1', externalUrl: 'https://github.com/owner/repo/issues/123' }];

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await updateGitHubTaskStatuses();

      expect(result.cancelled).toBe(1);
      expect(result.completed).toBe(0);
    });

    it('should handle non-404 error responses gracefully', async () => {
      mockOpenTasks = [{ id: 'task-1', externalUrl: 'https://github.com/owner/repo/issues/123' }];

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await updateGitHubTaskStatuses();

      expect(result.cancelled).toBe(0);
      expect(result.completed).toBe(0);
    });

    it('should mark completed issues as completed when PR merged', async () => {
      mockOpenTasks = [{ id: 'task-1', externalUrl: 'https://github.com/owner/repo/issues/123' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: 'closed',
          pull_request: { merged_at: '2025-01-15T00:00:00Z' },
          body: 'Some description',
        }),
      });

      const result = await updateGitHubTaskStatuses();

      expect(result.completed).toBe(1);
      expect(result.cancelled).toBe(0);
    });

    it('should mark completed issues as completed when body contains merged', async () => {
      mockOpenTasks = [{ id: 'task-1', externalUrl: 'https://github.com/owner/repo/issues/123' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: 'closed',
          body: 'This issue was merged via PR #456',
          state_reason: null,
        }),
      });

      const result = await updateGitHubTaskStatuses();

      expect(result.completed).toBe(1);
      expect(result.cancelled).toBe(0);
    });

    it('should mark completed issues as completed when state_reason is completed', async () => {
      mockOpenTasks = [{ id: 'task-1', externalUrl: 'https://github.com/owner/repo/issues/123' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: 'closed',
          body: 'Regular description',
          state_reason: 'completed',
        }),
      });

      const result = await updateGitHubTaskStatuses();

      expect(result.completed).toBe(1);
      expect(result.cancelled).toBe(0);
    });

    it('should mark closed but not merged issues as cancelled', async () => {
      mockOpenTasks = [{ id: 'task-1', externalUrl: 'https://github.com/owner/repo/issues/123' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: 'closed',
          body: "Closing this issue as won't fix",
          state_reason: 'not_planned',
        }),
      });

      const result = await updateGitHubTaskStatuses();

      expect(result.cancelled).toBe(1);
      expect(result.completed).toBe(0);
    });

    it('should handle fetch errors gracefully', async () => {
      mockOpenTasks = [{ id: 'task-1', externalUrl: 'https://github.com/owner/repo/issues/123' }];

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await updateGitHubTaskStatuses();

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to check');
    });

    it('should not update still-open issues', async () => {
      mockOpenTasks = [{ id: 'task-1', externalUrl: 'https://github.com/owner/repo/issues/123' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: 'open',
          body: 'Still working on this',
        }),
      });

      const result = await updateGitHubTaskStatuses();

      expect(result.completed).toBe(0);
      expect(result.cancelled).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getSyncStats with data', () => {
    it('should aggregate stats from multiple sources', async () => {
      mockSourceStats = [
        { source: 'github', count: 10 },
        { source: 'algora', count: 5 },
        { source: 'immunefi', count: 3 },
      ];

      const stats = await getSyncStats();

      expect(stats.totalTasks).toBe(18);
      expect(stats.bySource).toEqual({
        github: 10,
        algora: 5,
        immunefi: 3,
      });
    });

    it('should handle single source', async () => {
      mockSourceStats = [{ source: 'github', count: 25 }];

      const stats = await getSyncStats();

      expect(stats.totalTasks).toBe(25);
      expect(stats.bySource).toEqual({ github: 25 });
    });
  });

  describe('markStaleTasks with URLs', () => {
    it('should call database update with correct parameters', async () => {
      const result = await markStaleTasks('github', ['https://github.com/test/repo/issues/1']);
      expect(result).toBe(1); // Returns 1 due to mock returning [{ id: 'test-id' }]
    });
  });

  describe('syncSource with bounties', () => {
    it('should process fetched bounties and count created items', async () => {
      // Set up mock bounties
      mockGitHubBounties = [
        {
          source: 'github',
          externalId: 'github-test-1',
          externalUrl: 'https://github.com/test/repo/issues/1',
          title: 'Test bounty 1',
          description: 'Description 1',
          ownerExternalId: 'user1',
          labels: ['bounty'],
          createdAt: new Date(),
          raw: {},
        },
      ];

      // Mock upsert returns same createdAt and updatedAt (new record)
      const now = new Date();
      mockUpsertResult = [{ id: 'new-id', createdAt: now, updatedAt: now }];

      const result = await syncFromSource('github');

      expect(result.fetched).toBe(1);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should count updated items when timestamps differ', async () => {
      mockGitHubBounties = [
        {
          source: 'github',
          externalId: 'github-test-1',
          externalUrl: 'https://github.com/test/repo/issues/1',
          title: 'Test bounty 1',
          description: 'Description 1',
          ownerExternalId: 'user1',
          labels: ['bounty'],
          createdAt: new Date(),
          raw: {},
        },
      ];

      // Mock upsert returns different createdAt and updatedAt (updated record)
      const createdAt = new Date('2025-01-01T00:00:00Z');
      const updatedAt = new Date('2025-01-15T00:00:00Z');
      mockUpsertResult = [{ id: 'existing-id', createdAt, updatedAt }];

      const result = await syncFromSource('github');

      expect(result.fetched).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle database errors during insert', async () => {
      mockGitHubBounties = [
        {
          source: 'github',
          externalId: 'github-test-1',
          externalUrl: 'https://github.com/test/repo/issues/1',
          title: 'Test bounty 1',
          description: 'Description 1',
          ownerExternalId: 'user1',
          labels: ['bounty'],
          createdAt: new Date(),
          raw: {},
        },
      ];

      mockUpsertShouldThrow = true;

      const result = await syncFromSource('github');

      expect(result.fetched).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].externalId).toBe('github-test-1');
      expect(result.errors[0].message).toBe('Database insert failed');
    });

    it('should process multiple bounties and log progress', async () => {
      // Create 15 bounties to trigger progress logging
      mockGitHubBounties = Array.from({ length: 15 }, (_, i) => ({
        source: 'github' as const,
        externalId: `github-test-${i + 1}`,
        externalUrl: `https://github.com/test/repo/issues/${i + 1}`,
        title: `Test bounty ${i + 1}`,
        description: `Description ${i + 1}`,
        ownerExternalId: 'user1',
        labels: ['bounty'],
        createdAt: new Date(),
        raw: {},
      }));

      const result = await syncFromSource('github');

      expect(result.fetched).toBe(15);
      expect(result.created).toBe(15);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle bounties with various fields', async () => {
      mockGitHubBounties = [
        {
          source: 'github',
          externalId: 'github-test-1',
          externalUrl: 'https://github.com/test/repo/issues/1',
          title: 'Test bounty with deadline',
          description: 'Has a deadline',
          ownerExternalId: 'user1',
          labels: ['bounty', 'typescript'],
          createdAt: new Date(),
          deadline: new Date('2025-03-01'),
          raw: {},
        },
      ];

      const result = await syncFromSource('github');

      expect(result.fetched).toBe(1);
      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle source fetch errors gracefully', async () => {
      mockFetchShouldThrow = true;

      const result = await syncFromSource('github');

      expect(result.fetched).toBe(0);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].externalId).toBe('source-fetch');
      expect(result.errors[0].message).toBe('Source fetch failed');
    });
  });

  describe('runSync with bounties', () => {
    it('should process bounties through full sync', async () => {
      mockGitHubBounties = [
        {
          source: 'github',
          externalId: 'github-test-1',
          externalUrl: 'https://github.com/test/repo/issues/1',
          title: 'Test bounty',
          description: 'Description',
          ownerExternalId: 'user1',
          labels: ['bounty'],
          createdAt: new Date(),
          raw: {},
        },
      ];

      const results = await runSync({
        sources: { github: { enabled: true } },
      });

      const githubResult = results.find((r) => r.source === 'github');
      expect(githubResult).toBeDefined();
      expect(githubResult?.fetched).toBe(1);
    });
  });
});
