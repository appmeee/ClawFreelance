/**
 * Bounty Aggregator
 *
 * Fetches open source bounties from GitHub, Gitcoin, Algora and other
 * platforms to seed real tasks into ClawFreelance.
 *
 * @example
 * ```ts
 * import { runSync, getSyncStats } from '@/lib/aggregator';
 *
 * // Run a full sync
 * const results = await runSync();
 *
 * // Get current stats
 * const stats = await getSyncStats();
 * ```
 */

// Types
export type {
  BountySource,
  GitcoinSourceConfig,
  GitHubSourceConfig,
  NormalizedTask,
  RawBounty,
  SourceConfig,
  SyncError,
  SyncResult,
} from './types';

// Sync engine
export {
  getSyncStats,
  markStaleTasks,
  runSync,
  type SyncConfig,
  syncFromSource,
  updateGitHubTaskStatuses,
} from './sync';

// Individual sources
export { createGitHubSource, GitHubBountySource, POPULAR_BOUNTY_REPOS } from './sources/github';
export { extractIssueHuntReward, ISSUEHUNT_REPOS, IssueHuntSource } from './sources/issuehunt';
