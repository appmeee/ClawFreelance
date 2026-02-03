/**
 * Bounty Sync Engine
 *
 * Handles fetching bounties from all sources, deduplication,
 * and persisting to the database.
 */

import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { tasks } from '@/db/schema';

import { initGitHubAppAuth } from './github-app-auth';
import { createAlgoraSource } from './sources/algora';
import { createBugcrowdSource } from './sources/bugcrowd';
import { createGitHubSource } from './sources/github';
import { createGitHubIssuesSource } from './sources/github-issues';
import { createImmunefiSource } from './sources/immunefi';
import type { BountySource, SyncResult, TaskSource } from './types';

/**
 * Sync bounties from a single source to the database
 */
async function syncSource(source: BountySource): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    source: source.name,
    fetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Fetch all bounties from source
    console.log(`[sync] Fetching from ${source.name}...`);
    const rawBounties = await source.fetch();
    result.fetched = rawBounties.length;
    console.log(`[sync] Fetched ${rawBounties.length} items from ${source.name}, processing...`);

    let processed = 0;
    const logInterval = Math.max(1, Math.floor(rawBounties.length / 10)); // Log ~10 times

    for (const raw of rawBounties) {
      processed++;
      if (processed % logInterval === 0 || processed === rawBounties.length) {
        console.log(
          `[sync] ${source.name}: ${processed}/${rawBounties.length} (created=${result.created} updated=${result.updated} errors=${result.errors.length})`
        );
      }
      try {
        const normalized = source.normalize(raw);

        // Use UPSERT to handle duplicates atomically
        // This relies on the unique index on (externalUrl, source)
        const upsertResult = await db
          .insert(tasks)
          .values({
            title: normalized.title,
            description: normalized.description,
            type: normalized.type,
            source: normalized.source,
            externalUrl: normalized.externalUrl,
            ownerExternalId: normalized.ownerExternalId,
            rewardType: normalized.rewardType,
            rewardAmount: normalized.rewardAmount,
            rewardCurrency: normalized.rewardCurrency,
            visibility: normalized.visibility,
            isMilestoneBased: normalized.isMilestoneBased,
            status: normalized.status,
            verificationMethod: normalized.verificationMethod,
            difficulty: normalized.difficulty,
            requirements: normalized.requirements,
            deadline: normalized.deadline,
          })
          .onConflictDoUpdate({
            target: [tasks.externalUrl, tasks.source],
            set: {
              title: normalized.title,
              description: normalized.description,
              rewardAmount: normalized.rewardAmount,
              rewardCurrency: normalized.rewardCurrency,
              difficulty: normalized.difficulty,
              requirements: normalized.requirements,
              deadline: normalized.deadline,
              updatedAt: new Date(),
            },
          })
          .returning({ id: tasks.id, createdAt: tasks.createdAt, updatedAt: tasks.updatedAt });

        // Check if it was created (createdAt == updatedAt) or updated
        if (upsertResult.length > 0) {
          const row = upsertResult[0];
          // If createdAt and updatedAt are within 1 second, it's a new record
          const isNew = Math.abs(row.createdAt.getTime() - row.updatedAt.getTime()) < 1000;
          if (isNew) {
            result.created++;
          } else {
            result.updated++;
          }
        }
      } catch (error) {
        result.errors.push({
          externalId: raw.externalId,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  } catch (error) {
    result.errors.push({
      externalId: 'source-fetch',
      message: error instanceof Error ? error.message : 'Failed to fetch from source',
    });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Configuration for the sync engine
 */
export interface SyncConfig {
  sources?: {
    github?: {
      enabled?: boolean;
      repositories?: string[];
    };
    githubIssues?: {
      enabled?: boolean;
      repositories?: string[];
    };
    algora?: {
      enabled?: boolean;
      repositories?: string[];
    };
    immunefi?: {
      enabled?: boolean;
      maxPrograms?: number;
      minBounty?: number;
    };
    bugcrowd?: {
      enabled?: boolean;
      maxPrograms?: number;
    };
    gitcoin?: {
      enabled?: boolean;
    };
  };
}

/**
 * Check if a source should be enabled based on config
 */
function isSourceEnabled(
  sourceConfig: { enabled?: boolean } | undefined,
  hasSpecificSources: boolean
): boolean {
  if (hasSpecificSources) {
    return sourceConfig?.enabled === true;
  }
  return sourceConfig?.enabled !== false;
}

/**
 * Source factory definitions
 */
type SourceFactory = (config: SyncConfig) => BountySource | null;

const sourceFactories: Array<{ name: string; factory: SourceFactory }> = [
  {
    name: 'GitHub bounty',
    factory: (c) =>
      isSourceEnabled(c.sources?.github, !!(c.sources && Object.keys(c.sources).length > 0))
        ? createGitHubSource(c.sources?.github?.repositories)
        : null,
  },
  {
    name: 'GitHub issues',
    factory: (c) =>
      isSourceEnabled(c.sources?.githubIssues, !!(c.sources && Object.keys(c.sources).length > 0))
        ? createGitHubIssuesSource(c.sources?.githubIssues?.repositories)
        : null,
  },
  {
    name: 'Algora',
    factory: (c) =>
      isSourceEnabled(c.sources?.algora, !!(c.sources && Object.keys(c.sources).length > 0))
        ? createAlgoraSource(c.sources?.algora?.repositories)
        : null,
  },
  {
    name: 'Immunefi',
    factory: (c) =>
      isSourceEnabled(c.sources?.immunefi, !!(c.sources && Object.keys(c.sources).length > 0))
        ? createImmunefiSource({
            maxPrograms: c.sources?.immunefi?.maxPrograms,
            minBounty: c.sources?.immunefi?.minBounty,
          })
        : null,
  },
  {
    name: 'Bugcrowd',
    factory: (c) =>
      isSourceEnabled(c.sources?.bugcrowd, !!(c.sources && Object.keys(c.sources).length > 0))
        ? createBugcrowdSource({ maxPrograms: c.sources?.bugcrowd?.maxPrograms })
        : null,
  },
];

/**
 * Build list of enabled bounty sources from config
 */
function buildSourceList(config: SyncConfig): BountySource[] {
  const sources: BountySource[] = [];

  for (const { name, factory } of sourceFactories) {
    const source = factory(config);
    if (source) {
      console.log(`[sync] Enabling ${name} source`);
      sources.push(source);
    }
  }

  return sources;
}

/**
 * Run a full sync across all enabled sources
 */
export async function runSync(config: SyncConfig = {}): Promise<SyncResult[]> {
  const authInitialized = await initGitHubAppAuth();
  if (!authInitialized) {
    console.warn('[sync] GitHub App auth not available, using limited rate limits');
  }

  const sources = buildSourceList(config);
  console.log(`[sync] Running sync with ${sources.length} source(s)`);

  const results: SyncResult[] = [];
  for (const source of sources) {
    const result = await syncSource(source);
    results.push(result);
    console.log(
      `[sync] ${source.name}: fetched=${result.fetched} created=${result.created} updated=${result.updated} errors=${result.errors.length}`
    );
  }

  return results;
}

/**
 * Sync bounties from a specific source only
 */
export async function syncFromSource(
  sourceName: TaskSource,
  config?: SyncConfig
): Promise<SyncResult> {
  let source: BountySource;

  switch (sourceName) {
    case 'github':
      source = createGitHubSource(config?.sources?.github?.repositories);
      break;
    case 'algora':
      source = createAlgoraSource(config?.sources?.algora?.repositories);
      break;
    default:
      throw new Error(`Unsupported source: ${sourceName}`);
  }

  return syncSource(source);
}

/**
 * Mark stale external tasks as cancelled
 * (Tasks that no longer exist at the source)
 */
export async function markStaleTasks(
  sourceName: TaskSource,
  activeExternalUrls: string[]
): Promise<number> {
  if (activeExternalUrls.length === 0) {
    return 0;
  }

  // Find tasks from this source that are not in the active list
  const result = await db
    .update(tasks)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tasks.source, sourceName),
        eq(tasks.status, 'open'),
        sql`${tasks.externalUrl} NOT IN ${activeExternalUrls}`
      )
    )
    .returning({ id: tasks.id });

  return result.length;
}

/**
 * Check and update status for GitHub-sourced tasks
 * Marks tasks as completed/cancelled based on issue state
 */
export async function updateGitHubTaskStatuses(): Promise<{
  completed: number;
  cancelled: number;
  errors: string[];
}> {
  const { getGitHubHeaders, initGitHubAppAuth } = await import('./github-app-auth');

  // Initialize GitHub App auth for better rate limits
  await initGitHubAppAuth();

  const result = {
    completed: 0,
    cancelled: 0,
    errors: [] as string[],
  };

  // Get all open GitHub tasks
  const openTasks = await db
    .select({
      id: tasks.id,
      externalUrl: tasks.externalUrl,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'open'),
        sql`${tasks.source} IN ('github', 'algora')`,
        sql`${tasks.externalUrl} IS NOT NULL`
      )
    )
    .limit(100); // Process in batches

  const headers = getGitHubHeaders();

  for (const task of openTasks) {
    if (!task.externalUrl) continue;

    // Parse GitHub issue URL: https://github.com/owner/repo/issues/123
    const match = task.externalUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!match) continue;

    const [, owner, repo, issueNum] = match;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNum}`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Issue was deleted - mark as cancelled
          await db
            .update(tasks)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(eq(tasks.id, task.id));
          result.cancelled++;
        }
        continue;
      }

      const issue = await response.json();

      if (issue.state === 'closed') {
        // Check if it was merged (has associated PR that was merged)
        const prMatch = issue.pull_request?.merged_at;
        const hasLinkedMergedPR = issue.body?.toLowerCase().includes('merged');

        if (prMatch || hasLinkedMergedPR || issue.state_reason === 'completed') {
          await db
            .update(tasks)
            .set({ status: 'completed', updatedAt: new Date() })
            .where(eq(tasks.id, task.id));
          result.completed++;
        } else {
          // Closed but not merged - mark as cancelled
          await db
            .update(tasks)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(eq(tasks.id, task.id));
          result.cancelled++;
        }
      }

      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      result.errors.push(
        `Failed to check ${task.externalUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return result;
}

/**
 * Get sync statistics
 */
export async function getSyncStats(): Promise<{
  totalTasks: number;
  bySource: Record<string, number>;
  lastSync?: Date;
}> {
  const sourceStats = await db
    .select({
      source: tasks.source,
      count: sql<number>`count(*)`,
    })
    .from(tasks)
    .groupBy(tasks.source);

  const bySource: Record<string, number> = {};
  let total = 0;

  for (const stat of sourceStats) {
    bySource[stat.source] = Number(stat.count);
    total += Number(stat.count);
  }

  return {
    totalTasks: total,
    bySource,
  };
}
