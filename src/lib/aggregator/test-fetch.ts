#!/usr/bin/env bun
/**
 * Manual test script to verify GitHub bounty fetching works with real API
 *
 * Run with: bun run src/lib/aggregator/test-fetch.ts
 */

import { GitHubBountySource } from './sources/github';

async function testFetch() {
  console.log('🔍 Testing GitHub Bounty Fetcher with real API...\n');

  // Test repos - uses minimal labels to stay under unauthenticated rate limit
  // With GITHUB_TOKEN, can test more repos
  const hasToken = !!process.env.GITHUB_TOKEN;
  const testRepos = hasToken
    ? ['calcom/cal.com', 'twentyhq/twenty', 'Expensify/App', 'triggerdotdev/trigger.dev']
    : ['Expensify/App']; // Single repo to stay under rate limit

  // Use minimal labels to stay under rate limit without token
  const source = new GitHubBountySource({
    repositories: testRepos,
    bountyLabels: hasToken
      ? ['bounty', 'help wanted', 'good first issue', 'External']
      : ['External', 'help wanted'], // Just 2 labels = 2 requests
  });

  console.log(`Using ${hasToken ? 'authenticated' : 'unauthenticated'} mode`);

  console.log(`Fetching from ${testRepos.length} repos...`);
  console.log('Repos:', testRepos.join(', '));
  console.log('');

  const bounties = await source.fetch();

  console.log(`\n✅ Found ${bounties.length} bounties/issues\n`);

  if (bounties.length === 0) {
    console.log('No bounties found. This could mean:');
    console.log('- The repos have no open issues with bounty labels');
    console.log('- Rate limiting (try with GITHUB_TOKEN env var)');
    console.log('- Network issues');
    return;
  }

  // Show first 5 bounties
  const sample = bounties.slice(0, 5);
  console.log('=== Sample Bounties ===\n');

  for (const bounty of sample) {
    const normalized = source.normalize(bounty);

    console.log(`📋 ${bounty.title}`);
    console.log(`   Source: ${bounty.source}`);
    console.log(`   URL: ${bounty.externalUrl}`);
    console.log(`   Owner: ${bounty.ownerExternalId}`);
    console.log(`   Labels: ${bounty.labels?.join(', ') || 'none'}`);
    console.log(
      `   Reward: ${normalized.rewardAmount > 0 ? `${normalized.rewardAmount} ${normalized.rewardCurrency}` : 'Points only'}`
    );
    console.log(`   Difficulty: ${normalized.difficulty}`);
    console.log(`   Requirements: ${normalized.requirements.join(', ') || 'none'}`);
    console.log('');
  }

  // Summary by repo
  console.log('=== Summary by Repo ===\n');
  const byRepo = new Map<string, number>();
  for (const bounty of bounties) {
    const repo = bounty.externalUrl.split('/issues/')[0].replace('https://github.com/', '');
    byRepo.set(repo, (byRepo.get(repo) || 0) + 1);
  }

  for (const [repo, count] of byRepo) {
    console.log(`  ${repo}: ${count} bounties`);
  }

  // Reward summary
  const withRewards = bounties.filter((b) => {
    const n = source.normalize(b);
    return n.rewardAmount > 0;
  });
  console.log(`\n💰 ${withRewards.length}/${bounties.length} have explicit rewards`);
}

testFetch().catch(console.error);
