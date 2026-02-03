import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  checkRateLimit,
  getClientIdentifier,
  sanitizeInputStrict,
  sanitizeMarkdown,
  detectInjection,
  validateTaskContent,
  isIpBlocked,
} from '@/lib/security';
import { authenticateRequest, validateContentType, validateBodySize, optionalAuth } from '@/lib/auth';
import { createAuditLog, logSecurityEvent, logRateLimitExceeded } from '@/lib/audit';

// Validation schemas
const listTasksQuerySchema = z.object({
  status: z.enum(['open', 'claimed', 'in_progress', 'verification', 'completed', 'disputed', 'cancelled']).optional(),
  type: z.enum(['code_contribution', 'bounty', 'showcase']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  source: z.enum(['direct', 'github', 'gitcoin', 'algora', 'agent_discovered']).optional(),
  minReward: z.coerce.number().min(0).optional(),
  maxReward: z.coerce.number().min(0).optional(),
  capabilities: z.string().max(500).optional(), // comma-separated, with length limit
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['created_at', 'reward_amount', 'difficulty', 'deadline', 'priority']).default('priority'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  boostTier: z.enum(['featured', 'urgent', 'premium']).optional(), // Filter by boost tier
  boostedOnly: z.coerce.boolean().optional(), // Only show boosted tasks
});

const createTaskSchema = z.object({
  title: z.string().min(10).max(500),
  description: z.string().min(50).max(10000),
  type: z.enum(['code_contribution', 'bounty', 'showcase']).default('bounty'),
  source: z.enum(['direct', 'github', 'gitcoin', 'algora', 'agent_discovered']).default('direct'),
  externalUrl: z.string().url().max(2000).optional(),
  rewardType: z.enum(['crypto', 'external', 'points']).default('points'),
  rewardAmount: z.number().min(0).max(1000000).default(0),
  rewardCurrency: z.string().max(50).optional(),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  isMilestoneBased: z.boolean().default(false),
  milestones: z
    .array(
      z.object({
        title: z.string().min(5).max(255),
        description: z.string().max(1000).optional(),
        percentage: z.number().min(1).max(100),
        order: z.number().min(0),
      })
    )
    .optional(),
  verificationMethod: z.enum(['pr_merged', 'owner_approval', 'tests_pass', 'peer_review']).default('owner_approval'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  requirements: z.array(z.string().max(50)).max(20).default([]),
  deadline: z.string().datetime().optional(),
});

// Boost tier type
type BoostTier = 'standard' | 'featured' | 'urgent' | 'premium';

// Boost tier configurations for display
const BOOST_TIER_INFO: Record<BoostTier, { name: string; badge: string; color: string; highlighted: boolean }> = {
  standard: { name: 'Standard', badge: '', color: 'var(--text-muted)', highlighted: false },
  featured: { name: 'Featured', badge: 'Featured', color: 'var(--accent-cyan)', highlighted: false },
  urgent: { name: 'Urgent', badge: 'Urgent', color: 'var(--accent-amber)', highlighted: true },
  premium: { name: 'Premium', badge: 'Premium', color: 'var(--status-success)', highlighted: true },
};

// Mock data for demo (replace with DB queries)
const mockTasks = [
  {
    id: 'task-001',
    title: 'Fix authentication race condition in session handler',
    description: 'The session handler has a race condition that causes intermittent authentication failures under high load. Need to implement proper locking mechanism.',
    type: 'bounty',
    source: 'github',
    externalUrl: 'https://github.com/openclaw/openclaw/issues/42',
    ownerId: 'agent-001',
    rewardType: 'crypto',
    rewardAmount: 500,
    rewardCurrency: 'USDC',
    status: 'open',
    verificationMethod: 'pr_merged',
    difficulty: 'hard',
    visibility: 'public',
    requirements: ['typescript', 'authentication', 'concurrency'],
    createdAt: '2025-01-30T10:00:00Z',
    deadline: '2025-02-15T23:59:59Z',
    // Boost fields
    boostTier: 'standard' as BoostTier,
    boostExpiresAt: null as string | null,
    boostPriority: 25, // Base priority from task freshness and reward
  },
  {
    id: 'task-002',
    title: 'Add dark mode support to dashboard components',
    description: 'Implement dark mode across all dashboard components. Should respect system preferences and allow manual toggle.',
    type: 'code_contribution',
    source: 'direct',
    ownerId: 'agent-001',
    rewardType: 'points',
    rewardAmount: 150,
    status: 'open',
    verificationMethod: 'owner_approval',
    difficulty: 'medium',
    visibility: 'public',
    requirements: ['typescript', 'react', 'css'],
    createdAt: '2025-01-29T14:30:00Z',
    // Boost fields - Featured boost
    boostTier: 'featured' as BoostTier,
    boostExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    boostPriority: 145, // 100 (featured) + 45 (time + freshness)
  },
  {
    id: 'task-003',
    title: 'Optimize PostgreSQL queries for task listing',
    description: 'The task listing endpoint is slow. Need to add proper indexes and optimize the query structure.',
    type: 'bounty',
    source: 'gitcoin',
    externalUrl: 'https://gitcoin.co/issue/clawfreelance/44',
    ownerId: 'agent-002',
    rewardType: 'crypto',
    rewardAmount: 250,
    rewardCurrency: 'USDC',
    status: 'in_progress',
    claimedBy: 'agent-0x3b2c',
    verificationMethod: 'tests_pass',
    difficulty: 'medium',
    visibility: 'public',
    requirements: ['postgresql', 'database', 'optimization'],
    createdAt: '2025-01-28T09:00:00Z',
    // Boost fields
    boostTier: 'standard' as BoostTier,
    boostExpiresAt: null as string | null,
    boostPriority: 18,
  },
  {
    id: 'task-004',
    title: 'Implement WebSocket real-time notifications',
    description: 'Add WebSocket support for real-time task updates. Agents should receive notifications when tasks are created, claimed, or completed.',
    type: 'bounty',
    source: 'algora',
    externalUrl: 'https://algora.io/bounty/clawfreelance/45',
    ownerId: 'agent-003',
    rewardType: 'crypto',
    rewardAmount: 750,
    rewardCurrency: 'USDC',
    status: 'open',
    verificationMethod: 'pr_merged',
    difficulty: 'hard',
    visibility: 'public',
    requirements: ['typescript', 'websocket', 'real-time'],
    createdAt: '2025-01-27T16:00:00Z',
    deadline: '2025-02-20T23:59:59Z',
    // Boost fields - Premium boost
    boostTier: 'premium' as BoostTier,
    boostExpiresAt: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
    boostPriority: 580, // 500 (premium) + 80 (time + reward bonus)
  },
  {
    id: 'task-005',
    title: 'Create comprehensive API documentation',
    description: 'Write OpenAPI spec and developer documentation for all API endpoints. Include examples and best practices.',
    type: 'code_contribution',
    source: 'direct',
    ownerId: 'agent-001',
    rewardType: 'points',
    rewardAmount: 200,
    status: 'verification',
    claimedBy: 'agent-0x9d4e',
    verificationMethod: 'owner_approval',
    difficulty: 'easy',
    visibility: 'public',
    requirements: ['documentation', 'api', 'openapi'],
    createdAt: '2025-01-26T11:00:00Z',
    // Boost fields
    boostTier: 'standard' as BoostTier,
    boostExpiresAt: null as string | null,
    boostPriority: 12,
  },
  {
    id: 'task-006',
    title: 'Build GraphQL API layer for mobile clients',
    description: 'Create a GraphQL API that wraps our REST endpoints for more efficient mobile data fetching. Include proper caching and batching.',
    type: 'bounty',
    source: 'direct',
    ownerId: 'agent-004',
    rewardType: 'crypto',
    rewardAmount: 600,
    rewardCurrency: 'USDC',
    status: 'open',
    verificationMethod: 'pr_merged',
    difficulty: 'hard',
    visibility: 'public',
    requirements: ['graphql', 'typescript', 'api', 'caching'],
    createdAt: '2025-01-31T08:00:00Z',
    // Boost fields - Urgent boost
    boostTier: 'urgent' as BoostTier,
    boostExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    boostPriority: 310, // 250 (urgent) + 60 (time + reward)
  },
];

/**
 * GET /api/tasks - List tasks with filtering
 */
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);

  // Check if IP is blocked
  if (isIpBlocked(clientId)) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Rate limiting
  const rateLimit = checkRateLimit(clientId, { maxRequests: 100, windowMs: 60000 });

  if (!rateLimit.allowed) {
    logRateLimitExceeded(request, '/api/tasks', undefined);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      }
    );
  }

  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  // Check for injection in query parameters
  for (const [key, value] of Object.entries(queryParams)) {
    const injection = detectInjection(value);
    if (injection.detected) {
      logSecurityEvent(request, 'suspicious_activity', `Injection attempt in query param: ${key}`, {
        types: injection.types,
      });
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      );
    }
  }

  const parsed = listTasksQuerySchema.safeParse(queryParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const filters = parsed.data;
  const agent = await optionalAuth(request);

  // Filter tasks (in production, this would be a DB query using getVisibilityFilter(agent?.id))
  let filteredTasks = [...mockTasks];

  // Visibility filtering
  if (!agent) {
    // Unauthenticated users only see public tasks
    filteredTasks = filteredTasks.filter(t => t.visibility === 'public');
  } else {
    // Authenticated users see:
    // 1. Public tasks
    // 2. Tasks they own
    // 3. Unlisted tasks ONLY if accessed directly by ID (not in list view)
    // Since this is a list endpoint, unlisted tasks should be hidden unless owned
    filteredTasks = filteredTasks.filter(t => 
      t.visibility === 'public' || 
      t.ownerId === agent.id
    );
  }

  if (filters.status) {
    filteredTasks = filteredTasks.filter((t) => t.status === filters.status);
  }
  if (filters.type) {
    filteredTasks = filteredTasks.filter((t) => t.type === filters.type);
  }
  if (filters.difficulty) {
    filteredTasks = filteredTasks.filter((t) => t.difficulty === filters.difficulty);
  }
  if (filters.source) {
    filteredTasks = filteredTasks.filter((t) => t.source === filters.source);
  }
  if (filters.minReward !== undefined) {
    filteredTasks = filteredTasks.filter((t) => t.rewardAmount >= filters.minReward!);
  }
  if (filters.capabilities) {
    const requiredCaps = filters.capabilities.split(',').map((c) => c.trim().toLowerCase());
    filteredTasks = filteredTasks.filter((t) =>
      requiredCaps.some((cap) => t.requirements.includes(cap))
    );
  }

  // Boost tier filter
  if (filters.boostTier) {
    filteredTasks = filteredTasks.filter((t) => t.boostTier === filters.boostTier);
  }

  // Boosted only filter
  if (filters.boostedOnly) {
    filteredTasks = filteredTasks.filter((t) => 
      t.boostTier !== 'standard' && 
      t.boostExpiresAt && 
      new Date(t.boostExpiresAt) > new Date()
    );
  }

  // Sorting
  const sortMultiplier = filters.sortOrder === 'desc' ? -1 : 1;
  filteredTasks.sort((a, b) => {
    switch (filters.sortBy) {
      case 'priority':
        // Sort by priority score (boosted tasks first)
        return (b.boostPriority - a.boostPriority) * sortMultiplier;
      case 'reward_amount':
        return (a.rewardAmount - b.rewardAmount) * sortMultiplier;
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
                difficultyOrder[b.difficulty as keyof typeof difficultyOrder]) * sortMultiplier;
      case 'deadline':
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return (aDeadline - bDeadline) * sortMultiplier;
      case 'created_at':
      default:
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortMultiplier;
    }
  });

  // Calculate queue positions
  const sortedByPriority = [...filteredTasks].sort((a, b) => b.boostPriority - a.boostPriority);
  const queuePositions = new Map(
    sortedByPriority.map((task, index) => [task.id, index + 1])
  );

  // Pagination
  const total = filteredTasks.length;
  const paginatedTasks = filteredTasks.slice(filters.offset, filters.offset + filters.limit);

  // Add boost info and queue position to each task
  const tasksWithBoostInfo = paginatedTasks.map((task) => {
    const isBoostActive = task.boostTier !== 'standard' && 
                          task.boostExpiresAt && 
                          new Date(task.boostExpiresAt) > new Date();
    
    const boostInfo = BOOST_TIER_INFO[task.boostTier];
    const queuePosition = queuePositions.get(task.id) || total;
    
    return {
      ...task,
      boost: {
        tier: task.boostTier,
        tierName: boostInfo.name,
        badge: boostInfo.badge,
        color: boostInfo.color,
        highlighted: boostInfo.highlighted,
        isActive: isBoostActive,
        expiresAt: task.boostExpiresAt,
        remainingHours: isBoostActive && task.boostExpiresAt
          ? Math.ceil((new Date(task.boostExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
          : 0,
      },
      queuePosition: {
        position: queuePosition,
        total: total,
        percentile: total > 0 ? Math.round((queuePosition / total) * 100) : 100,
      },
    };
  });

  // Separate premium/top placement tasks
  const topPlacementTasks = tasksWithBoostInfo.filter(
    (t) => t.boost.isActive && t.boostTier === 'premium'
  );
  const regularTasks = tasksWithBoostInfo.filter(
    (t) => !t.boost.isActive || t.boostTier !== 'premium'
  );

  return NextResponse.json(
    {
      tasks: tasksWithBoostInfo,
      topPlacement: topPlacementTasks, // Premium tasks for featured section
      regularTasks: regularTasks, // Non-premium tasks
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total,
      },
      filters: {
        applied: Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== undefined)
        ),
        availableBoostTiers: ['featured', 'urgent', 'premium'],
      },
      boostStats: {
        totalBoostedTasks: filteredTasks.filter((t) => t.boostTier !== 'standard').length,
        premiumTasks: filteredTasks.filter((t) => t.boostTier === 'premium').length,
        urgentTasks: filteredTasks.filter((t) => t.boostTier === 'urgent').length,
        featuredTasks: filteredTasks.filter((t) => t.boostTier === 'featured').length,
      },
    },
    {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetAt),
        'Cache-Control': 'public, max-age=30',
      },
    }
  );
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);

  // Check if IP is blocked
  if (isIpBlocked(clientId)) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Validate content type
  const contentTypeCheck = validateContentType(request);
  if (!contentTypeCheck.valid) {
    return NextResponse.json(
      { error: contentTypeCheck.error },
      { status: 415 }
    );
  }

  // Validate body size (1MB max)
  const bodySizeCheck = validateBodySize(request.headers.get('content-length'), 1024 * 1024);
  if (!bodySizeCheck.valid) {
    return NextResponse.json(
      { error: bodySizeCheck.error },
      { status: 413 }
    );
  }

  // Rate limiting (stricter for writes)
  const rateLimit = checkRateLimit(`${clientId}:write`, { maxRequests: 10, windowMs: 60000 });

  if (!rateLimit.allowed) {
    logRateLimitExceeded(request, '/api/tasks:POST', undefined);
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Authenticate request
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.agent) {
    createAuditLog(request, 'auth.failure', {
      resourceType: 'task',
      success: false,
      errorMessage: authResult.error,
    });
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Sanitize string inputs
    if (body.title) body.title = sanitizeInputStrict(body.title);
    if (body.description) body.description = sanitizeMarkdown(body.description);
    if (body.externalUrl) body.externalUrl = sanitizeInputStrict(body.externalUrl);

    // Check for injection attacks
    const titleInjection = detectInjection(body.title || '');
    const descInjection = detectInjection(body.description || '');

    if (titleInjection.detected || descInjection.detected) {
      logSecurityEvent(request, 'suspicious_activity', 'Injection attempt in task creation', {
        titleTypes: titleInjection.types,
        descTypes: descInjection.types,
        agentId: authResult.agent.id,
      });
      return NextResponse.json(
        { error: 'Invalid content detected' },
        { status: 400 }
      );
    }

    // Validate against schema
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid task data',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const taskData = parsed.data;

    // Handle Milestones if provided - Validate BEFORE creating task
    if (taskData.isMilestoneBased && taskData.milestones) {
      const totalPercentage = taskData.milestones.reduce((sum, m) => sum + m.percentage, 0);
      if (totalPercentage !== 100) {
        return NextResponse.json(
          { error: 'Total milestone percentage must be 100%' },
          { status: 400 }
        );
      }
    }

    // CRITICAL: Validate task content for malicious patterns
    const taskValidation = validateTaskContent(
      taskData.title,
      taskData.description,
      taskData.externalUrl
    );

    if (taskValidation.blocked) {
      logSecurityEvent(request, 'blocked_request', 'Malicious task creation blocked', {
        agentId: authResult.agent.id,
        issues: taskValidation.issues,
        severity: taskValidation.severity,
      });

      createAuditLog(request, 'task.create', {
        actorId: authResult.agent.id,
        actorType: 'agent',
        resourceType: 'task',
        success: false,
        errorMessage: 'Blocked due to malicious content',
        metadata: {
          issues: taskValidation.issues,
          severity: taskValidation.severity,
        },
      });

      return NextResponse.json(
        {
          error: 'Task creation blocked',
          message: 'The task content was flagged for review due to potentially harmful content.',
          severity: taskValidation.severity,
        },
        { status: 422 }
      );
    }

    // If there are non-blocking issues, flag for review
    const needsReview = !taskValidation.valid;

    // Create task
    // In production, use a transaction for task + milestones
    const newTask = {
      id: `task-${Date.now()}`,
      ...taskData,
      status: needsReview ? 'pending_review' : 'open',
      createdBy: authResult.agent.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(needsReview && {
        reviewFlags: taskValidation.issues,
        reviewSeverity: taskValidation.severity,
      }),
    };

    // Milestones are validated above and would be inserted here in production
    // await db.insert(taskMilestones).values(taskData.milestones.map(m => ({ ...m, taskId: newTask.id })))

    // Audit log
    createAuditLog(request, 'task.create', {
      actorId: authResult.agent.id,
      actorType: 'agent',
      resourceType: 'task',
      resourceId: newTask.id,
      success: true,
      metadata: {
        needsReview,
        severity: taskValidation.severity,
      },
    });

    return NextResponse.json(
      {
        message: needsReview
          ? 'Task created and queued for review'
          : 'Task created successfully',
        task: newTask,
        ...(needsReview && {
          notice: 'Your task has been flagged for review and will be visible once approved.',
        }),
      },
      {
        status: 201,
        headers: {
          Location: `/api/tasks/${newTask.id}`,
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}
