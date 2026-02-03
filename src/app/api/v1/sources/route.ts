import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { POPULAR_BOUNTY_REPOS } from '@/lib/aggregator/sources/github';

/**
 * Source configuration types
 */
interface SourceInfo {
  name: string;
  type: 'github' | 'gitcoin' | 'algora' | 'opencollective';
  status: 'active' | 'pending' | 'disabled';
  description: string;
  config?: {
    repositories?: string[];
    labels?: string[];
  };
  stats?: {
    lastSync?: string;
    taskCount?: number;
  };
}

// Schema for adding a new source
const addSourceSchema = z.object({
  type: z.enum(['github', 'gitcoin', 'algora', 'opencollective']),
  config: z
    .object({
      repositories: z.array(z.string().max(200)).max(100).optional(),
      labels: z.array(z.string().max(50)).max(20).optional(),
    })
    .optional(),
});

/**
 * GET /api/v1/sources
 * List all configured bounty sources
 */
export async function GET(_request: NextRequest) {
  const sources: SourceInfo[] = [
    {
      name: 'GitHub Issues',
      type: 'github',
      status: 'active',
      description: 'Fetch bounties from GitHub issues with bounty-related labels',
      config: {
        repositories: POPULAR_BOUNTY_REPOS,
        labels: ['bounty', 'help wanted', 'good first issue', 'paid', 'reward', 'External'],
      },
    },
    {
      name: 'Gitcoin',
      type: 'gitcoin',
      status: 'pending',
      description: 'Decentralized bounty platform for open source (coming soon)',
    },
    {
      name: 'Algora',
      type: 'algora',
      status: 'active',
      description: 'Developer bounty platform with GitHub integration',
      config: {
        repositories: ['zio/zio', 'zio/zio-blocks', 'golemcloud/golem-cli', 'omnigres/omnigres'],
        labels: ['💎 Bounty', 'algora', 'bounty'],
      },
    },
    {
      name: 'Open Collective',
      type: 'opencollective',
      status: 'pending',
      description: 'Funded issues from Open Collective projects (coming soon)',
    },
  ];

  return NextResponse.json({
    success: true,
    data: {
      sources,
      summary: {
        total: sources.length,
        active: sources.filter((s) => s.status === 'active').length,
        pending: sources.filter((s) => s.status === 'pending').length,
      },
    },
  });
}

/**
 * POST /api/v1/sources
 * Add a custom repository or source to track
 * Note: Currently only supports adding GitHub repositories
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const syncSecret = process.env.SYNC_SECRET;

  if (process.env.NODE_ENV !== 'development') {
    if (!syncSecret || !authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [_scheme, token] = authHeader.split(' ');
    if (token !== syncSecret) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const validated = addSourceSchema.safeParse(body);

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

    const { type, config } = validated.data;

    // For now, we only support dynamic GitHub repos
    if (type !== 'github') {
      return NextResponse.json(
        {
          success: false,
          error: `Source type '${type}' is not yet supported for dynamic configuration`,
        },
        { status: 400 }
      );
    }

    // In a full implementation, this would save to database
    // For now, return success with info about what would be added
    return NextResponse.json({
      success: true,
      message: 'Source configuration received',
      data: {
        type,
        config,
        note: 'Dynamic source persistence coming soon. Currently using environment-based config.',
      },
    });
  } catch (error) {
    console.error('[sources] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add source',
      },
      { status: 500 }
    );
  }
}
