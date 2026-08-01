import { describe, expect, it } from 'vitest';
import { extractIssueHuntReward, ISSUEHUNT_REPOS, IssueHuntSource } from './issuehunt';

describe('extractIssueHuntReward', () => {
  it('extracts reward from /issuehunt comment', () => {
    const text = 'Some issue body\n/issuehunt $250\nPlease solve this.';
    const result = extractIssueHuntReward(text);
    expect(result).toEqual({ amount: 250, currency: 'USD' });
  });

  it('extracts reward from 💵 emoji tag', () => {
    const text = '💵 $500 bounty on Issuehunt';
    const result = extractIssueHuntReward(text);
    expect(result).toEqual({ amount: 500, currency: 'USD' });
  });

  it('returns null when no reward pattern is found', () => {
    const text = 'Regular issue description without bounty info.';
    const result = extractIssueHuntReward(text);
    expect(result).toBeNull();
  });
});

describe('IssueHuntSource', () => {
  it('initializes with default configuration', () => {
    const source = new IssueHuntSource();
    expect(source.name).toBe('issuehunt');
    expect(source.type).toBe('github_issuehunt');
  });

  it('normalizes raw bounty data correctly', () => {
    const source = new IssueHuntSource();
    const rawBounty = {
      id: 'issuehunt-123',
      title: 'Fix issuehunt bug',
      description: 'Detailed description',
      url: 'https://github.com/test/repo/issues/1',
      reward_amount: 100,
      reward_currency: 'USD',
      created_at: '2026-08-01T00:00:00Z',
      raw_data: {
        number: 1,
        repo: 'test/repo',
      },
    };

    const normalized = source.normalize(rawBounty);
    expect(normalized.id).toBe('issuehunt-123');
    expect(normalized.reward).toBe(100);
    expect(normalized.source).toBe('issuehunt');
    expect(normalized.tags).toContain('issuehunt');
  });
});
