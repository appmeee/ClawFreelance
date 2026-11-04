import { describe, expect, it } from 'vitest';
import { GitcoinBountySource, createGitcoinSource } from './gitcoin';
import type { RawBounty } from '../types';

describe('GitcoinBountySource', () => {
  describe('constructor', () => {
    it('should be disabled by default', () => {
      const source = new GitcoinBountySource();
      expect(source.name).toBe('gitcoin');
    });

    it('should accept custom configurations', () => {
      const source = new GitcoinBountySource({
        enabled: true,
        apiKey: 'test-api-key',
        networks: ['mainnet', 'base'],
      });
      expect(source.name).toBe('gitcoin');
    });
  });

  describe('fetch', () => {
    it('should return empty list when disabled', async () => {
      const source = new GitcoinBountySource({ enabled: false });
      const results = await source.fetch();
      expect(results).toEqual([]);
    });

    it('should return empty list when enabled but no apiKey provided', async () => {
      const source = new GitcoinBountySource({ enabled: true, apiKey: '' });
      const results = await source.fetch();
      expect(results).toEqual([]);
    });
  });

  describe('normalize', () => {
    it('should correctly normalize raw bounty to a task format', () => {
      const source = new GitcoinBountySource();
      const raw: RawBounty = {
        source: 'gitcoin',
        externalId: 'gitcoin-bounty-1',
        externalUrl: 'https://gitcoin.co/grants/123',
        title: 'Build decentralized indexer',
        description: 'Implement GraphQL API for events',
        ownerExternalId: 'gitcoin-org',
        ownerName: 'Gitcoin Community',
        rewardAmount: 500,
        rewardCurrency: 'USDC',
        labels: ['web3', 'defi'],
        createdAt: new Date('2026-01-01'),
      };

      const task = source.normalize(raw);

      expect(task.title).toBe(raw.title);
      expect(task.description).toBe(raw.description);
      expect(task.type).toBe('bounty');
      expect(task.source).toBe('gitcoin');
      expect(task.rewardType).toBe('crypto');
      expect(task.rewardAmount).toBe(500);
      expect(task.rewardCurrency).toBe('USDC');
      expect(task.status).toBe('open');
      expect(task.verificationMethod).toBe('pr_merged');
      expect(task.difficulty).toBe('medium');
    });

    it('should fallback to points if no rewardAmount is provided', () => {
      const source = new GitcoinBountySource();
      const raw: RawBounty = {
        source: 'gitcoin',
        externalId: 'gitcoin-bounty-2',
        externalUrl: 'https://gitcoin.co/grants/456',
        title: 'Community contribution',
        description: 'Documentation translation',
        ownerExternalId: 'gitcoin-org',
        ownerName: 'Gitcoin Community',
        createdAt: new Date('2026-01-01'),
      };

      const task = source.normalize(raw);

      expect(task.rewardType).toBe('points');
      expect(task.rewardAmount).toBe(0);
      expect(task.rewardCurrency).toBe('ETH');
    });
  });

  describe('createGitcoinSource', () => {
    it('should create an instance of GitcoinBountySource', () => {
      const instance = createGitcoinSource();
      expect(instance).toBeInstanceOf(GitcoinBountySource);
      expect(instance.name).toBe('gitcoin');
    });
  });
});
