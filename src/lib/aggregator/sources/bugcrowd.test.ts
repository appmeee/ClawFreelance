import { describe, expect, it } from 'vitest';
import { BugcrowdBountySource, createBugcrowdSource } from './bugcrowd';
import type { RawBounty } from '../types';

describe('BugcrowdBountySource', () => {
  describe('constructor', () => {
    it('should initialize with default parameters', () => {
      const source = new BugcrowdBountySource();
      expect(source.name).toBe('bugcrowd');
    });

    it('should configure custom tokens and limits', () => {
      const source = new BugcrowdBountySource({
        enabled: true,
        token: 'test_token_123',
        maxPrograms: 50,
      });
      expect(source.name).toBe('bugcrowd');
    });
  });

  describe('fetch', () => {
    it('should return empty list if disabled', async () => {
      const source = new BugcrowdBountySource({ enabled: false });
      const results = await source.fetch();
      expect(results).toEqual([]);
    });

    it('should return empty list if token is not configured', async () => {
      const source = new BugcrowdBountySource({ enabled: true, token: '' });
      const results = await source.fetch();
      expect(results).toEqual([]);
    });
  });

  describe('normalize', () => {
    it('should normalize raw bounty to security bounty task schema', () => {
      const source = new BugcrowdBountySource();
      const raw: RawBounty = {
        source: 'bugcrowd',
        externalId: 'bc-tesla',
        externalUrl: 'https://bugcrowd.com/tesla',
        title: 'Tesla Bug Bounty Program',
        description: 'Vulnerability disclosure program',
        ownerExternalId: 'tesla-inc',
        ownerName: 'Tesla',
        rewardAmount: 15000,
        rewardCurrency: 'USD',
        createdAt: new Date(),
      };

      const task = source.normalize(raw);
      expect(task.title).toBe(raw.title);
      expect(task.type).toBe('bounty');
      expect(task.source).toBe('bugcrowd');
      expect(task.rewardType).toBe('external');
      expect(task.rewardAmount).toBe(15000);
      expect(task.rewardCurrency).toBe('USD');
      expect(task.verificationMethod).toBe('owner_approval');
      expect(task.difficulty).toBe('medium');
      expect(task.requirements).toContain('security-research');
    });
  });

  describe('createBugcrowdSource', () => {
    it('should create an instance of BugcrowdBountySource', () => {
      const instance = createBugcrowdSource();
      expect(instance).toBeInstanceOf(BugcrowdBountySource);
      expect(instance.name).toBe('bugcrowd');
    });
  });
});
