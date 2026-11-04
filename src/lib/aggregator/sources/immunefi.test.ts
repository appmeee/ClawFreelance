import { describe, expect, it } from 'vitest';
import { ImmunefiBountySource, createImmunefiSource } from './immunefi';
import type { RawBounty } from '../types';

describe('ImmunefiBountySource', () => {
  describe('constructor', () => {
    it('should initialize with default parameters', () => {
      const source = new ImmunefiBountySource();
      expect(source.name).toBe('immunefi');
    });

    it('should respect custom configurations', () => {
      const source = new ImmunefiBountySource({
        enabled: false,
        maxPrograms: 50,
        minBounty: 25000,
      });
      expect(source.name).toBe('immunefi');
    });
  });

  describe('fetch', () => {
    it('should return empty array if disabled', async () => {
      const source = new ImmunefiBountySource({ enabled: false });
      const results = await source.fetch();
      expect(results).toEqual([]);
    });
  });

  describe('normalize', () => {
    it('should calculate hard difficulty for bounties >= $100k', () => {
      const source = new ImmunefiBountySource();
      const raw: RawBounty = {
        source: 'immunefi',
        externalId: 'immunefi-ethereum',
        externalUrl: 'https://immunefi.com/bug-bounty/ethereum',
        title: 'Ethereum Bug Bounty',
        description: 'Vulnerability assessment',
        rewardAmount: 250000,
        rewardCurrency: 'USD',
        createdAt: new Date(),
      };

      const task = source.normalize(raw);
      expect(task.title).toBe(raw.title);
      expect(task.rewardAmount).toBe(250000);
      expect(task.difficulty).toBe('hard');
      expect(task.verificationMethod).toBe('owner_approval');
      expect(task.rewardType).toBe('external');
    });

    it('should calculate medium difficulty for bounties >= $25k and < $100k', () => {
      const source = new ImmunefiBountySource();
      const raw: RawBounty = {
        source: 'immunefi',
        externalId: 'immunefi-protocol',
        externalUrl: 'https://immunefi.com/bug-bounty/protocol',
        title: 'Protocol Bug Bounty',
        description: 'Security testing',
        rewardAmount: 50000,
        rewardCurrency: 'USD',
        createdAt: new Date(),
      };

      const task = source.normalize(raw);
      expect(task.difficulty).toBe('medium');
    });

    it('should calculate easy difficulty for bounties < $25k', () => {
      const source = new ImmunefiBountySource();
      const raw: RawBounty = {
        source: 'immunefi',
        externalId: 'immunefi-small',
        externalUrl: 'https://immunefi.com/bug-bounty/small',
        title: 'Small Project Bounty',
        description: 'Testing',
        rewardAmount: 15000,
        rewardCurrency: 'USD',
        createdAt: new Date(),
      };

      const task = source.normalize(raw);
      expect(task.difficulty).toBe('easy');
    });
  });

  describe('createImmunefiSource', () => {
    it('should create an instance of ImmunefiBountySource', () => {
      const instance = createImmunefiSource();
      expect(instance).toBeInstanceOf(ImmunefiBountySource);
      expect(instance.name).toBe('immunefi');
    });
  });
});
