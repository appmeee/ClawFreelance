import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSyncStats, runSync, type SyncConfig, updateGitHubTaskStatuses } from '@/lib/aggregator';
import { POPULAR_BOUNTY_REPOS } from '@/lib/aggregator/sources/github';

// Schema for sync request
const syncRequestSchema = z.object({
  sources: z
    .object({
      github: z
        .object({
          enabled: z.boolean().optional(),
          repositories: z.array(z.string().max(200)).max(50).optional(),
        })
        .optional(),
      githubIssues: z
        .object({
          enabled: z.boolean().optional(),
          repositories: z.array(z.string().max(200)).max(50).optional(),
        })
        .optional(),
      algora: z
        .object({
          enabled: z.boolean().optional(),
          repositories: z.array(z.string().max(200)).max(50).optional(),
        })
        .optional(),
      immunefi: z
        .object({
          enabled: z.boolean().optional(),
          maxPrograms: z.number().int().min(1).max(500).optional(),
          minBounty: z.number().int().min(0).optional(),
        })
        .optional(),
      bugcrowd: z
        .object({
          enabled: z.boolean().optional(),
          maxPrograms: z.number().int().min(1).max(500).optional(),
        })
        .optional(),
      gitcoin: z
        .object({
          enabled: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
});

/**
 * Verify the sync secret key
 * This endpoint should only be called by authorized systems (cron jobs, admin)
 */
function verifySyncAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const syncSecret = process.env.SYNC_SECRET;

  // In development, allow without auth
  if (process.env.NODE_ENV === 'development' && !syncSecret) {
    return true;
  }

  if (!syncSecret) {
    console.error('[sync] SYNC_SECRET not configured');
    return false;
  }

  if (!authHeader) {
    return false;
  }

  // Support both "Bearer <secret>" and "Secret <secret>" formats
  const [_scheme, token] = authHeader.split(' ');
  if (!token) {
    return false;
  }

  return token === syncSecret;
}

/**
 * GET /api/v1/sync
 * Get current sync statistics
 */
export async function GET(_request: NextRequest) {
  try {
    const stats = await getSyncStats();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        availableSources: ['github', 'githubIssues', 'algora', 'immunefi'],
        pendingSources: ['gitcoin', 'bugcrowd'],
        defaultRepositories: POPULAR_BOUNTY_REPOS,
      },
    });
  } catch (error) {
    console.error('[sync] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sync stats',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/sync
 * Trigger a sync operation
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifySyncAuth(request)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized. Provide valid SYNC_SECRET in Authorization header.',
      },
      { status: 401 }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validated = syncRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validated.error.flatten(),
        },
        { status: 400 }
      );
    }

    const config: SyncConfig = validated.data;

    // Run the sync
    console.log('[sync] Starting sync with config:', JSON.stringify(config));
    const results = await runSync(config);

    // Calculate totals
    const totals = {
      fetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    for (const result of results) {
      totals.fetched += result.fetched;
      totals.created += result.created;
      totals.updated += result.updated;
      totals.skipped += result.skipped;
      totals.errors += result.errors.length;
    }

    // Check for stale tasks (closed/merged issues)
    console.log('[sync] Checking for stale tasks...');
    const staleResult = await updateGitHubTaskStatuses();
    console.log(
      `[sync] Stale check: completed=${staleResult.completed} cancelled=${staleResult.cancelled}`
    );

    // Log the sync operation
    console.log(
      '[sync] Completed:',
      JSON.stringify({
        totals,
        stale: staleResult,
        sources: results.map((r) => r.source),
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        results,
        totals,
        staleTasksUpdated: {
          completed: staleResult.completed,
          cancelled: staleResult.cancelled,
          errors: staleResult.errors.length,
        },
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[sync] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}
