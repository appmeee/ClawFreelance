import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGitHubSource, GitHubBountySource, POPULAR_BOUNTY_REPOS } from './github';

// Mock the github-app-auth module
vi.mock('../github-app-auth', () => ({
  getGitHubAuthHeaderAsync: vi.fn(() => Promise.resolve('Bearer mock-token')),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GitHubBountySource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default config when none provided', () => {
      const source = new GitHubBountySource();
      expect(source.name).toBe('github');
    });

    it('should accept custom repositories', () => {
      const source = new GitHubBountySource({
        repositories: ['custom/repo1', 'custom/repo2'],
      });
      expect(source.name).toBe('github');
    });

    it('should accept custom bounty labels', () => {
      const source = new GitHubBountySource({
        bountyLabels: ['custom-bounty', 'reward'],
      });
      expect(source.name).toBe('github');
    });
  });

  describe('fetch', () => {
    it('should return empty array when disabled', async () => {
      const source = new GitHubBountySource({ enabled: false });
      const result = await source.fetch();
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch issues from configured repositories', async () => {
      const mockIssue = {
        id: 123,
        number: 42,
        title: 'Fix authentication bug',
        body: 'This is a bounty worth $500 USD',
        html_url: 'https://github.com/test/repo/issues/42',
        state: 'open',
        labels: [{ name: 'bounty', color: 'ff0000' }],
        user: { login: 'testuser', id: 1 },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-20T15:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total_count: 1,
          incomplete_results: false,
          items: [mockIssue],
        }),
      });

      const source = new GitHubBountySource({
        repositories: ['test/repo'],
        bountyLabels: ['bounty'],
      });

      const result = await source.fetch();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        source: 'github',
        externalId: 'github-test/repo-42',
        externalUrl: 'https://github.com/test/repo/issues/42',
        title: 'Fix authentication bug',
        ownerExternalId: 'testuser',
      });
    });

    it('should handle API rate limits gracefully', async () => {
      // All label requests return 403 rate limit
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Rate limit exceeded',
      });

      const source = new GitHubBountySource({
        repositories: ['test/repo'],
      });

      const result = await source.fetch();
      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      // All label requests return 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const source = new GitHubBountySource({
        repositories: ['test/repo'],
      });

      const result = await source.fetch();
      expect(result).toEqual([]);
    });

    it('should handle network failures gracefully', async () => {
      // All label requests fail with network error
      mockFetch.mockRejectedValue(new Error('Network error'));

      const source = new GitHubBountySource({
        repositories: ['test/repo'],
      });

      const result = await source.fetch();
      expect(result).toEqual([]);
    });
  });

  describe('normalize', () => {
    it('should normalize raw bounty to task format', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'github-test/repo-42',
        externalUrl: 'https://github.com/test/repo/issues/42',
        title: 'Fix authentication bug',
        description: 'This is a bounty worth $500 USD for fixing the auth bug',
        ownerExternalId: 'testuser',
        ownerName: 'testuser',
        labels: ['bounty', 'typescript', 'backend'],
        createdAt: new Date('2025-01-15T10:00:00Z'),
        updatedAt: new Date('2025-01-20T15:00:00Z'),
        raw: {},
      };

      const normalized = source.normalize(raw);

      expect(normalized).toMatchObject({
        title: 'Fix authentication bug',
        type: 'bounty',
        source: 'github',
        externalUrl: 'https://github.com/test/repo/issues/42',
        ownerExternalId: 'testuser',
        rewardType: 'external',
        rewardAmount: 500,
        rewardCurrency: 'USD',
        visibility: 'public',
        status: 'open',
        verificationMethod: 'pr_merged',
      });
    });

    it('should extract reward from title bracket format [$250]', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: '[$250] Fix the authentication bug',
        description: 'Some description without reward info',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(250);
      expect(normalized.rewardCurrency).toBe('USD');
    });

    it('should extract USD reward from body', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Reward: $1,000 USD for completing this task',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(1000);
      expect(normalized.rewardCurrency).toBe('USD');
    });

    it('should extract ETH reward from body', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Bounty: 0.5 ETH for this feature',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(0.5);
      expect(normalized.rewardCurrency).toBe('ETH');
    });

    it('should default to points when no reward found', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Simple feature request',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardType).toBe('points');
      expect(normalized.rewardAmount).toBe(0);
    });

    it('should infer easy difficulty from labels', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Description',
        ownerExternalId: 'user',
        labels: ['good first issue', 'bounty'],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.difficulty).toBe('easy');
    });

    it('should infer hard difficulty from labels', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Description',
        ownerExternalId: 'user',
        labels: ['hard', 'expert', 'bounty'],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.difficulty).toBe('hard');
    });

    it('should extract tech requirements from labels', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Description',
        ownerExternalId: 'user',
        labels: ['typescript', 'react', 'frontend'],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.requirements).toContain('typescript');
      expect(normalized.requirements).toContain('react');
      expect(normalized.requirements).toContain('frontend');
    });
  });

  describe('POPULAR_BOUNTY_REPOS', () => {
    it('should contain well-known bounty repositories', () => {
      // Web3/Blockchain
      expect(POPULAR_BOUNTY_REPOS).toContain('ethereum/go-ethereum');
      expect(POPULAR_BOUNTY_REPOS).toContain('bitcoin/bitcoin');
      expect(POPULAR_BOUNTY_REPOS).toContain('solana-labs/solana');

      // Open source apps (cal.com ecosystem)
      expect(POPULAR_BOUNTY_REPOS).toContain('calcom/cal.com');
      expect(POPULAR_BOUNTY_REPOS).toContain('twentyhq/twenty');
      expect(POPULAR_BOUNTY_REPOS).toContain('supabase/supabase');

      // Developer tools
      expect(POPULAR_BOUNTY_REPOS).toContain('vercel/next.js');

      // Should have significant coverage
      expect(POPULAR_BOUNTY_REPOS.length).toBeGreaterThan(50);
    });

    it('should have valid repo format (owner/name)', () => {
      for (const repo of POPULAR_BOUNTY_REPOS) {
        expect(repo).toMatch(/^[\w-]+\/[\w.-]+$/);
      }
    });
  });

  describe('createGitHubSource', () => {
    it('should create source with default repos', () => {
      const source = createGitHubSource();
      expect(source.name).toBe('github');
    });

    it('should create source with custom repos', () => {
      const source = createGitHubSource(['custom/repo1', 'custom/repo2']);
      expect(source.name).toBe('github');
    });
  });

  describe('config token fallback', () => {
    it('should use config token when no auth header available', async () => {
      // Mock getGitHubAuthHeaderAsync to return null
      const { getGitHubAuthHeaderAsync } = await import('../github-app-auth');
      vi.mocked(getGitHubAuthHeaderAsync).mockResolvedValueOnce(null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 0, incomplete_results: false, items: [] }),
      });

      const source = new GitHubBountySource({
        token: 'my-custom-token',
        repositories: ['test/repo'],
        bountyLabels: ['bounty'],
      });

      await source.fetch();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-custom-token',
          }),
        })
      );
    });
  });

  describe('issue deduplication', () => {
    it('should deduplicate issues matching multiple labels', async () => {
      const mockIssue = {
        id: 123,
        number: 42,
        title: 'Test issue with multiple labels',
        body: 'Description',
        html_url: 'https://github.com/test/repo/issues/42',
        state: 'open',
        labels: [
          { name: 'bounty', color: 'ff0000' },
          { name: 'help wanted', color: '00ff00' },
        ],
        user: { login: 'testuser', id: 1 },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-20T15:00:00Z',
      };

      // Both label searches return the same issue
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ total_count: 1, incomplete_results: false, items: [mockIssue] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ total_count: 1, incomplete_results: false, items: [mockIssue] }),
        });

      const source = new GitHubBountySource({
        repositories: ['test/repo'],
        bountyLabels: ['bounty', 'help wanted'],
      });

      const result = await source.fetch();

      // Should only have one issue despite matching two labels
      expect(result).toHaveLength(1);
      expect(result[0].externalId).toBe('github-test/repo-42');
    });
  });

  describe('batch processing', () => {
    it('should process multiple repositories with delays', async () => {
      // Mock setTimeout to execute immediately
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout;

      const mockIssue1 = {
        id: 1,
        number: 1,
        title: 'Issue 1',
        body: null,
        html_url: 'https://github.com/repo1/test/issues/1',
        state: 'open',
        labels: [{ name: 'bounty', color: 'ff0000' }],
        user: { login: 'user1', id: 1 },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-20T15:00:00Z',
      };

      const mockIssue2 = {
        id: 2,
        number: 2,
        title: 'Issue 2',
        body: null,
        html_url: 'https://github.com/repo2/test/issues/2',
        state: 'open',
        labels: [{ name: 'bounty', color: 'ff0000' }],
        user: { login: 'user2', id: 2 },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-20T15:00:00Z',
      };

      // First repo returns issue 1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 1, incomplete_results: false, items: [mockIssue1] }),
      });
      // Second repo returns issue 2
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 1, incomplete_results: false, items: [mockIssue2] }),
      });

      try {
        const source = new GitHubBountySource({
          repositories: ['repo1/test', 'repo2/test'],
          bountyLabels: ['bounty'],
        });

        const result = await source.fetch();

        expect(result).toHaveLength(2);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('normalize edge cases', () => {
    it('should extract reward from label with amount', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'No reward in body',
        ownerExternalId: 'user',
        labels: ['$100 USD', 'bounty'],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(100);
      expect(normalized.rewardCurrency).toBe('USD');
    });

    it('should extract BTC reward from body', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Reward: 0.01 BTC for this fix',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(0.01);
      expect(normalized.rewardCurrency).toBe('BTC');
    });

    it('should extract SOL reward from body', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'This task pays 5 SOL',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(5);
      expect(normalized.rewardCurrency).toBe('SOL');
    });

    it('should extract bounty pattern from body', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'bounty: 750 for completing this',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(750);
      expect(normalized.rewardCurrency).toBe('USD'); // Defaults to USD when no currency specified
    });

    it('should extract comma-formatted amounts from title', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: '[$1,000] Big feature request',
        description: 'Description',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardAmount).toBe(1000);
      expect(normalized.rewardCurrency).toBe('USD');
    });

    it('should infer easy difficulty from body content', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'This is a simple fix for a typo in the documentation',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.difficulty).toBe('easy');
    });

    it('should infer hard difficulty from body content', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'This requires a complete architecture redesign of the auth system',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.difficulty).toBe('hard');
    });

    it('should extract backend requirements from labels', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Description',
        ownerExternalId: 'user',
        labels: ['backend', 'node'],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.requirements).toContain('backend');
      expect(normalized.requirements).toContain('node');
    });

    it('should extract smart contract requirements from labels', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Description',
        ownerExternalId: 'user',
        labels: ['smart contract', 'solidity', 'web3'],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.requirements).toContain('smart-contracts');
      expect(normalized.requirements).toContain('solidity');
      expect(normalized.requirements).toContain('web3');
    });

    it('should extract documentation requirements from labels', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Description',
        ownerExternalId: 'user',
        labels: ['documentation', 'docs'],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.requirements).toContain('documentation');
    });

    it('should extract testing requirements from labels', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Description',
        ownerExternalId: 'user',
        labels: ['testing', 'test coverage'],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.requirements).toContain('testing');
    });

    it('should extract multiple tech requirements from labels', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Description',
        ownerExternalId: 'user',
        labels: ['javascript', 'python', 'rust', 'go'],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.requirements).toContain('javascript');
      expect(normalized.requirements).toContain('python');
      expect(normalized.requirements).toContain('rust');
      expect(normalized.requirements).toContain('go');
    });

    it('should handle null body for reward extraction', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: null as unknown as string,
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.rewardType).toBe('points');
      expect(normalized.rewardAmount).toBe(0);
    });

    it('should handle undefined labels', () => {
      const source = new GitHubBountySource();
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Description',
        ownerExternalId: 'user',
        createdAt: new Date(),
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.requirements).toEqual([]);
      expect(normalized.difficulty).toBe('medium');
    });

    it('should include deadline from milestone', () => {
      const source = new GitHubBountySource();
      const deadline = new Date('2025-03-01T00:00:00Z');
      const raw = {
        source: 'github' as const,
        externalId: 'test-1',
        externalUrl: 'https://github.com/test/repo/issues/1',
        title: 'Test',
        description: 'Description',
        ownerExternalId: 'user',
        labels: [],
        createdAt: new Date(),
        deadline: deadline,
        raw: {},
      };

      const normalized = source.normalize(raw);
      expect(normalized.deadline).toEqual(deadline);
    });
  });

  describe('fetch with milestone', () => {
    it('should extract deadline from issue milestone', async () => {
      const mockIssue = {
        id: 123,
        number: 42,
        title: 'Test issue',
        body: 'Description',
        html_url: 'https://github.com/test/repo/issues/42',
        state: 'open',
        labels: [{ name: 'bounty', color: 'ff0000' }],
        user: { login: 'testuser', id: 1 },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-20T15:00:00Z',
        milestone: {
          due_on: '2025-03-01T00:00:00Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_count: 1, incomplete_results: false, items: [mockIssue] }),
      });

      const source = new GitHubBountySource({
        repositories: ['test/repo'],
        bountyLabels: ['bounty'],
      });

      const result = await source.fetch();

      expect(result[0].deadline).toEqual(new Date('2025-03-01T00:00:00Z'));
    });
  });
});
