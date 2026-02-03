import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ALGORA_REPOS, AlgoraBountySource, createAlgoraSource } from './algora';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock GitHub App Auth
vi.mock('../github-app-auth', () => ({
  getGitHubAuthHeaderAsync: vi.fn(() => Promise.resolve('Bearer test-token')),
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
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return empty array when disabled', async () => {
      const source = new AlgoraBountySource({ enabled: false });
      const result = await source.fetch();
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch Algora bounties from configured repositories', async () => {
      // Use real timers but mock setTimeout to resolve immediately
      vi.useRealTimers();
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout;

      try {
        const mockIssue = {
          id: 456,
          number: 101,
          title: 'Implement new feature',
          body: '/bounty $500\n\nPlease implement this feature...',
          html_url: 'https://github.com/zio/zio/issues/101',
          state: 'open',
          labels: [{ name: '💎 Bounty', color: 'ff0000' }],
          user: { login: 'ziodev', id: 2 },
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-20T15:00:00Z',
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            total_count: 1,
            incomplete_results: false,
            items: [mockIssue],
          }),
        });

        const source = new AlgoraBountySource({
          repositories: ['zio/zio'],
        });

        const result = await source.fetch();

        expect(mockFetch).toHaveBeenCalled();
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          source: 'algora',
          externalId: 'algora-zio/zio-101',
          externalUrl: 'https://github.com/zio/zio/issues/101',
          title: 'Implement new feature',
          ownerExternalId: 'ziodev',
        });
      } finally {
        global.setTimeout = originalSetTimeout;
        vi.useFakeTimers();
      }
    });

    it('should handle rate limits gracefully', async () => {
      // All label requests return 403
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
      });

      const source = new AlgoraBountySource({
        repositories: ['test/repo'],
      });

      const fetchPromise = source.fetch();
      await vi.runAllTimersAsync();
      const result = await fetchPromise;

      expect(result).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      // All label requests fail with network error
      mockFetch.mockRejectedValue(new Error('Network error'));

      const source = new AlgoraBountySource({
        repositories: ['test/repo'],
      });

      const fetchPromise = source.fetch();
      await vi.runAllTimersAsync();
      const result = await fetchPromise;

      expect(result).toEqual([]);
    });
  });

  describe('normalize', () => {
    it('should normalize raw Algora bounty to task format', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'algora-zio/zio-101',
        externalUrl: 'https://github.com/zio/zio/issues/101',
        title: 'Implement new feature',
        description: '/bounty $500\n\nPlease implement this feature...',
        ownerExternalId: 'ziodev',
        ownerName: 'ziodev',
        labels: ['💎 Bounty'],
        createdAt: new Date('2025-01-15T10:00:00Z'),
        updatedAt: new Date('2025-01-20T15:00:00Z'),
        raw: {},
      };

      const normalized = source.normalize(raw);

      expect(normalized).toMatchObject({
        title: 'Implement new feature',
        type: 'bounty',
        source: 'algora',
        externalUrl: 'https://github.com/zio/zio/issues/101',
        ownerExternalId: 'ziodev',
        rewardType: 'external',
        rewardAmount: 500,
        rewardCurrency: 'USD',
        visibility: 'public',
        status: 'open',
        verificationMethod: 'pr_merged',
        difficulty: 'medium',
      });
    });

    it('should extract reward from /bounty $X pattern', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: '/bounty $1000\n\nSome description here',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(1000);
      expect(normalized.rewardCurrency).toBe('USD');
    });

    it('should extract reward from 💎 emoji pattern', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: '💎 $250 bounty for this task',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(250);
      expect(normalized.rewardCurrency).toBe('USD');
    });

    it('should default to points when no Algora reward found', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Simple feature request without bounty info',
        ownerExternalId: 'user',
        labels: ['💎 Bounty'],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardType).toBe('points');
      expect(normalized.rewardAmount).toBe(0);
    });
  });

  describe('ALGORA_REPOS', () => {
    it('should contain well-known Algora-active repositories', () => {
      expect(ALGORA_REPOS).toContain('zio/zio');
      expect(ALGORA_REPOS).toContain('golemcloud/golem-cli');
      expect(ALGORA_REPOS).toContain('omnigres/omnigres');
    });

    it('should have valid repo format (owner/name)', () => {
      for (const repo of ALGORA_REPOS) {
        expect(repo).toMatch(/^[\w-]+\/[\w.-]+$/);
      }
    });
  });

  describe('normalize edge cases', () => {
    it('should handle missing description', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: '',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardType).toBe('points');
      expect(normalized.rewardAmount).toBe(0);
    });

    it('should handle pre-parsed reward amount', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Some description without bounty',
        ownerExternalId: 'user',
        labels: [],
        rewardAmount: 750,
        rewardCurrency: 'USD',
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardType).toBe('external');
      expect(normalized.rewardAmount).toBe(750);
      expect(normalized.rewardCurrency).toBe('USD');
    });

    it('should extract reward from $X bounty pattern', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: '$1,500 bounty for completing this task',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(1500);
    });

    it('should handle ## 💎 header pattern', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: '## 💎 $2,500 bounty\n\nImplement this feature',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(2500);
    });

    it('should handle bounty: pattern', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'bounty: $300 for this task',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(300);
    });

    it('should handle reward: pattern', () => {
      const source = new AlgoraBountySource();
      const raw = {
        source: 'algora' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'reward: $400',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(400);
    });

    it('should handle deadline in raw data', () => {
      const source = new AlgoraBountySource();
      const deadline = new Date('2025-03-01');
      const raw = {
        source: 'algora' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: '/bounty $100',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        deadline,
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.deadline).toBe(deadline);
    });
  });

  describe('fetch with multiple repos', () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    it('should handle empty results from repos', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout;

      try {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            total_count: 0,
            incomplete_results: false,
            items: [],
          }),
        });

        const source = new AlgoraBountySource({
          repositories: ['test/repo1', 'test/repo2'],
        });

        const result = await source.fetch();
        expect(result).toEqual([]);
        expect(mockFetch).toHaveBeenCalled();
      } finally {
        global.setTimeout = originalSetTimeout;
        vi.useFakeTimers();
      }
    });

    it('should skip non-403 errors and continue', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout;

      try {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
        });

        const source = new AlgoraBountySource({
          repositories: ['test/repo'],
        });

        const result = await source.fetch();
        expect(result).toEqual([]);
      } finally {
        global.setTimeout = originalSetTimeout;
        vi.useFakeTimers();
      }
    });

    it('should fetch comments when issue body has no reward', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout;

      try {
        const mockIssue = {
          id: 456,
          number: 101,
          title: 'Implement feature',
          body: 'No bounty info here',
          html_url: 'https://github.com/test/repo/issues/101',
          state: 'open',
          labels: [{ name: '💎 Bounty', color: 'ff0000' }],
          user: { login: 'testuser', id: 2 },
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-20T15:00:00Z',
        };

        // First call: search issues
        // Second call: fetch comments
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              total_count: 1,
              incomplete_results: false,
              items: [mockIssue],
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => [{ body: '/bounty $200', user: { login: 'algora-pbc' } }],
          })
          .mockResolvedValue({
            ok: true,
            json: async () => ({
              total_count: 0,
              incomplete_results: false,
              items: [],
            }),
          });

        const source = new AlgoraBountySource({
          repositories: ['test/repo'],
        });

        const result = await source.fetch();
        expect(result).toHaveLength(1);
        expect(result[0].rewardAmount).toBe(200);
      } finally {
        global.setTimeout = originalSetTimeout;
        vi.useFakeTimers();
      }
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

  describe('fetch edge cases', () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    it('should filter out issues without Algora patterns', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout;

      try {
        const mockIssue = {
          id: 456,
          number: 101,
          title: 'Regular bug fix',
          body: 'Just a regular issue with no bounty patterns',
          html_url: 'https://github.com/test/repo/issues/101',
          state: 'open',
          labels: [{ name: 'bug', color: 'ff0000' }], // No Algora label
          user: { login: 'testuser', id: 2 },
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-20T15:00:00Z',
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            total_count: 1,
            incomplete_results: false,
            items: [mockIssue],
          }),
        });

        const source = new AlgoraBountySource({
          repositories: ['test/repo'],
        });

        const result = await source.fetch();
        // Issue should be filtered out because it has no Algora patterns
        expect(result).toEqual([]);
      } finally {
        global.setTimeout = originalSetTimeout;
        vi.useFakeTimers();
      }
    });

    it('should handle comments with no valid bounty', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout;

      try {
        const mockIssue = {
          id: 456,
          number: 101,
          title: 'Bounty task',
          body: 'No bounty info in body',
          html_url: 'https://github.com/test/repo/issues/101',
          state: 'open',
          labels: [{ name: '💎 Bounty', color: 'ff0000' }],
          user: { login: 'testuser', id: 2 },
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-20T15:00:00Z',
        };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              total_count: 1,
              incomplete_results: false,
              items: [mockIssue],
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => [
              { body: 'Just a regular comment', user: { login: 'user1' } },
              { body: 'Another comment', user: { login: 'user2' } },
            ],
          })
          .mockResolvedValue({
            ok: true,
            json: async () => ({ total_count: 0, incomplete_results: false, items: [] }),
          });

        const source = new AlgoraBountySource({
          repositories: ['test/repo'],
        });

        const result = await source.fetch();
        expect(result).toHaveLength(1);
        expect(result[0].rewardAmount).toBeUndefined();
      } finally {
        global.setTimeout = originalSetTimeout;
        vi.useFakeTimers();
      }
    });

    it('should handle comment fetch error gracefully', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout;

      try {
        const mockIssue = {
          id: 456,
          number: 101,
          title: 'Bounty task',
          body: 'No bounty info in body',
          html_url: 'https://github.com/test/repo/issues/101',
          state: 'open',
          labels: [{ name: '💎 Bounty', color: 'ff0000' }],
          user: { login: 'testuser', id: 2 },
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-20T15:00:00Z',
        };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              total_count: 1,
              incomplete_results: false,
              items: [mockIssue],
            }),
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 403,
          })
          .mockResolvedValue({
            ok: true,
            json: async () => ({ total_count: 0, incomplete_results: false, items: [] }),
          });

        const source = new AlgoraBountySource({
          repositories: ['test/repo'],
        });

        const result = await source.fetch();
        expect(result).toHaveLength(1);
      } finally {
        global.setTimeout = originalSetTimeout;
        vi.useFakeTimers();
      }
    });
  });
});
