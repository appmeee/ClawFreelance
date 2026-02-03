import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  checkRateLimit,
  getClientIdentifier,
  isIpBlocked,
} from '@/lib/security';
import { authenticateRequest } from '@/lib/auth';
import { createAuditLog, logRateLimitExceeded } from '@/lib/audit';
import {
  calculateBoostPrice,
  calculatePriorityScore,
  isValidBoostTier,
  isValidBoostDuration,
  isBoostActive,
  getBoostRemainingHours,
  formatTimeRemaining,
  BOOST_TIERS,
  BOOST_DURATIONS,
  type BoostTier,
} from '@/lib/boost';

// Validation schema for boost creation
const createBoostSchema = z.object({
  tier: z.enum(['featured', 'urgent', 'premium']),
  durationHours: z.number().min(24).max(720),
  currency: z.enum(['USD', 'USDC', 'ETH', 'SOL']).default('USD'),
  paymentTxHash: z.string().max(255).optional(), // For crypto payments
});

// Mock task data for demo (same as route.ts)
const mockTasks: Record<string, {
  id: string;
  title: string;
  ownerId: string;
  rewardAmount: number;
  currentBoostTier: BoostTier;
  boostExpiresAt: string | null;
  boostPriority: number;
  totalBoostSpend: number;
  createdAt: string;
}> = {
  'task-001': {
    id: 'task-001',
    title: 'Fix authentication race condition in session handler',
    ownerId: 'agent-001',
    rewardAmount: 500,
    currentBoostTier: 'standard',
    boostExpiresAt: null,
    boostPriority: 0,
    totalBoostSpend: 0,
    createdAt: '2025-01-30T10:00:00Z',
  },
  'task-002': {
    id: 'task-002',
    title: 'Add dark mode support to dashboard components',
    ownerId: 'agent-001',
    rewardAmount: 150,
    currentBoostTier: 'featured',
    boostExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    boostPriority: 120,
    totalBoostSpend: 999,
    createdAt: '2025-01-29T14:30:00Z',
  },
  'task-004': {
    id: 'task-004',
    title: 'Implement WebSocket real-time notifications',
    ownerId: 'agent-003',
    rewardAmount: 750,
    currentBoostTier: 'premium',
    boostExpiresAt: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
    boostPriority: 550,
    totalBoostSpend: 5997,
    createdAt: '2025-01-27T16:00:00Z',
  },
};

// Mock boost history
const mockBoostHistory: Record<string, {
  id: string;
  taskId: string;
  tier: BoostTier;
  durationHours: number;
  priceAmount: number;
  startsAt: string;
  expiresAt: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  impressionsBefore: number;
  impressionsDuring: number;
  clicksBefore: number;
  clicksDuring: number;
  claimsDuring: number;
}[]> = {
  'task-002': [
    {
      id: 'boost-001',
      taskId: 'task-002',
      tier: 'featured',
      durationHours: 72,
      priceAmount: 1347,
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      paymentStatus: 'completed',
      impressionsBefore: 45,
      impressionsDuring: 156,
      clicksBefore: 12,
      clicksDuring: 38,
      claimsDuring: 2,
    },
  ],
  'task-004': [
    {
      id: 'boost-002',
      taskId: 'task-004',
      tier: 'urgent',
      durationHours: 168,
      priceAmount: 5593,
      startsAt: '2025-01-28T10:00:00Z',
      expiresAt: '2025-02-04T10:00:00Z',
      paymentStatus: 'completed',
      impressionsBefore: 120,
      impressionsDuring: 890,
      clicksBefore: 35,
      clicksDuring: 210,
      claimsDuring: 5,
    },
    {
      id: 'boost-003',
      taskId: 'task-004',
      tier: 'premium',
      durationHours: 168,
      priceAmount: 11193,
      startsAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
      paymentStatus: 'completed',
      impressionsBefore: 890,
      impressionsDuring: 2340,
      clicksBefore: 210,
      clicksDuring: 478,
      claimsDuring: 8,
    },
  ],
};

/**
 * GET /api/tasks/[id]/boost - Get boost information for a task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const clientId = getClientIdentifier(request);

  // Check if IP is blocked
  if (isIpBlocked(clientId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Rate limiting
  const rateLimit = checkRateLimit(clientId, {
    maxRequests: 100,
    windowMs: 60000,
  });
  if (!rateLimit.allowed) {
    logRateLimitExceeded(request, `/api/tasks/${taskId}/boost`, undefined);
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Get task
  const task = mockTasks[taskId];
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Calculate queue position (mock calculation)
  const allPriorities = Object.values(mockTasks).map((t) => t.boostPriority);
  const sortedPriorities = [...allPriorities].sort((a, b) => b - a);
  const position = sortedPriorities.indexOf(task.boostPriority) + 1;

  // Get boost history
  const boostHistory = mockBoostHistory[taskId] || [];

  // Calculate current status
  const isActive = isBoostActive(
    task.currentBoostTier,
    task.boostExpiresAt ? new Date(task.boostExpiresAt) : null
  );
  const remainingHours = getBoostRemainingHours(
    task.boostExpiresAt ? new Date(task.boostExpiresAt) : null
  );
  const timeRemaining = formatTimeRemaining(
    task.boostExpiresAt ? new Date(task.boostExpiresAt) : null
  );

  return NextResponse.json({
    taskId,
    currentBoost: {
      tier: task.currentBoostTier,
      tierInfo: BOOST_TIERS[task.currentBoostTier],
      isActive,
      expiresAt: task.boostExpiresAt,
      remainingHours,
      timeRemaining,
      priorityScore: task.boostPriority,
    },
    queuePosition: {
      position,
      totalTasks: allPriorities.length,
      percentile: Math.round((position / allPriorities.length) * 100),
    },
    totalSpend: task.totalBoostSpend,
    boostHistory: boostHistory.map((b) => ({
      id: b.id,
      tier: b.tier,
      tierInfo: BOOST_TIERS[b.tier],
      durationHours: b.durationHours,
      priceAmount: b.priceAmount,
      startsAt: b.startsAt,
      expiresAt: b.expiresAt,
      paymentStatus: b.paymentStatus,
      analytics: {
        impressionsBefore: b.impressionsBefore,
        impressionsDuring: b.impressionsDuring,
        impressionLift:
          b.impressionsBefore > 0
            ? Math.round(
                ((b.impressionsDuring - b.impressionsBefore) /
                  b.impressionsBefore) *
                  100
              )
            : 100,
        clicksBefore: b.clicksBefore,
        clicksDuring: b.clicksDuring,
        claimsDuring: b.claimsDuring,
        ctr:
          b.impressionsDuring > 0
            ? Math.round((b.clicksDuring / b.impressionsDuring) * 10000) / 100
            : 0,
      },
    })),
    availableTiers: Object.entries(BOOST_TIERS)
      .filter(([tier]) => tier !== 'standard')
      .map(([tier, info]) => ({
        tier,
        ...info,
        pricing: BOOST_DURATIONS.map((d) => ({
          ...calculateBoostPrice(tier as BoostTier, d.hours),
          durationLabel: d.label,
        })),
      })),
  });
}

/**
 * POST /api/tasks/[id]/boost - Create a new boost for a task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const clientId = getClientIdentifier(request);

  // Check if IP is blocked
  if (isIpBlocked(clientId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Rate limiting (stricter for writes)
  const rateLimit = checkRateLimit(`${clientId}:boost`, {
    maxRequests: 10,
    windowMs: 60000,
  });
  if (!rateLimit.allowed) {
    logRateLimitExceeded(request, `/api/tasks/${taskId}/boost:POST`, undefined);
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Authenticate request
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.agent) {
    createAuditLog(request, 'auth.failure', {
      resourceType: 'boost',
      success: false,
      errorMessage: authResult.error,
    });
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    );
  }

  // Get task
  const task = mockTasks[taskId];
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Verify ownership
  if (task.ownerId !== authResult.agent.id) {
    createAuditLog(request, 'authorization.failure', {
      actorId: authResult.agent.id,
      actorType: 'agent',
      resourceType: 'boost',
      resourceId: taskId,
      success: false,
      errorMessage: 'Not task owner',
    });
    return NextResponse.json(
      { error: 'Only the task owner can boost this task' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createBoostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid boost data',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { tier, durationHours, currency, paymentTxHash } = parsed.data;

    // Validate tier
    if (!isValidBoostTier(tier)) {
      return NextResponse.json(
        { error: 'Invalid boost tier' },
        { status: 400 }
      );
    }

    // Validate duration
    if (!isValidBoostDuration(durationHours)) {
      return NextResponse.json(
        { error: 'Invalid boost duration. Valid options: 24, 72, 168, 336, 720 hours' },
        { status: 400 }
      );
    }

    // Check if task already has a higher or equal tier active
    const currentTierPriority = BOOST_TIERS[task.currentBoostTier].priorityScore;
    const newTierPriority = BOOST_TIERS[tier].priorityScore;
    const currentlyActive = isBoostActive(
      task.currentBoostTier,
      task.boostExpiresAt ? new Date(task.boostExpiresAt) : null
    );

    if (currentlyActive && newTierPriority <= currentTierPriority) {
      return NextResponse.json(
        {
          error: 'Task already has an active boost of equal or higher tier',
          currentTier: task.currentBoostTier,
          currentExpiresAt: task.boostExpiresAt,
        },
        { status: 400 }
      );
    }

    // Calculate pricing
    const pricing = calculateBoostPrice(tier, durationHours, currency);

    // Calculate new boost expiration
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);

    // Calculate new priority score
    const newPriority = calculatePriorityScore(
      tier,
      expiresAt,
      new Date(task.createdAt),
      task.rewardAmount
    );

    // Create boost record (mock - in production, insert into database)
    const boostId = `boost-${Date.now()}`;
    const newBoost = {
      id: boostId,
      taskId,
      agentId: authResult.agent.id,
      tier,
      durationHours,
      priceAmount: pricing.discountedPrice,
      priceCurrency: currency,
      paymentStatus: paymentTxHash ? 'completed' : 'pending',
      paymentTxHash,
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      queuePositionAtStart: 1, // Would calculate in production
    };

    // Update task boost info (mock - in production, update database)
    // task.currentBoostTier = tier;
    // task.boostExpiresAt = expiresAt.toISOString();
    // task.boostPriority = newPriority;
    // task.totalBoostSpend += pricing.discountedPrice;

    // Audit log
    createAuditLog(request, 'boost.create', {
      actorId: authResult.agent.id,
      actorType: 'agent',
      resourceType: 'boost',
      resourceId: boostId,
      success: true,
      metadata: {
        taskId,
        tier,
        durationHours,
        priceAmount: pricing.discountedPrice,
        currency,
      },
    });

    return NextResponse.json(
      {
        message: 'Boost created successfully',
        boost: {
          id: boostId,
          taskId,
          tier,
          tierInfo: BOOST_TIERS[tier],
          durationHours,
          pricing: {
            basePrice: pricing.basePrice,
            discountedPrice: pricing.discountedPrice,
            currency,
            savings: pricing.basePrice - pricing.discountedPrice,
          },
          startsAt: newBoost.startsAt,
          expiresAt: newBoost.expiresAt,
          paymentStatus: newBoost.paymentStatus,
          newPriorityScore: newPriority,
        },
        task: {
          id: taskId,
          title: task.title,
          newBoostTier: tier,
          boostExpiresAt: expiresAt.toISOString(),
        },
        ...(newBoost.paymentStatus === 'pending' && {
          payment: {
            required: true,
            amount: pricing.discountedPrice,
            currency,
            instructions: currency === 'USD'
              ? 'Complete payment through our payment processor'
              : `Send ${pricing.discountedPrice / 100} ${currency} to complete the boost`,
          },
        }),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

/**
 * DELETE /api/tasks/[id]/boost - Cancel an active boost
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const clientId = getClientIdentifier(request);

  // Check if IP is blocked
  if (isIpBlocked(clientId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Authenticate request
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.agent) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    );
  }

  // Get task
  const task = mockTasks[taskId];
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Verify ownership
  if (task.ownerId !== authResult.agent.id) {
    return NextResponse.json(
      { error: 'Only the task owner can cancel the boost' },
      { status: 403 }
    );
  }

  // Check if there's an active boost
  const isActive = isBoostActive(
    task.currentBoostTier,
    task.boostExpiresAt ? new Date(task.boostExpiresAt) : null
  );

  if (!isActive) {
    return NextResponse.json(
      { error: 'No active boost to cancel' },
      { status: 400 }
    );
  }

  // In production: Update task to remove boost
  // Note: No refunds for cancelled boosts - this is just for stopping visibility
  // task.currentBoostTier = 'standard';
  // task.boostExpiresAt = null;
  // task.boostPriority = calculatePriorityScore('standard', null, new Date(task.createdAt), task.rewardAmount);

  createAuditLog(request, 'boost.cancel', {
    actorId: authResult.agent.id,
    actorType: 'agent',
    resourceType: 'boost',
    resourceId: taskId,
    success: true,
    metadata: {
      previousTier: task.currentBoostTier,
      remainingHours: getBoostRemainingHours(
        task.boostExpiresAt ? new Date(task.boostExpiresAt) : null
      ),
    },
  });

  return NextResponse.json({
    message: 'Boost cancelled successfully',
    task: {
      id: taskId,
      previousTier: task.currentBoostTier,
      newTier: 'standard',
    },
    notice: 'Boost has been cancelled. No refunds are provided for cancelled boosts.',
  });
}
