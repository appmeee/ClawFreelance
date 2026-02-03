import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIdentifier, isIpBlocked } from '@/lib/security';
import { authenticateRequest } from '@/lib/auth';
import { logRateLimitExceeded } from '@/lib/audit';
import {
  calculateAnalyticsSummary,
  getBoostEffectivenessRating,
  formatPrice,
  BOOST_TIERS,
  type BoostTier,
} from '@/lib/boost';

// Query schema for analytics
const analyticsQuerySchema = z.object({
  taskId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tier: z.enum(['featured', 'urgent', 'premium']).optional(),
});

// Mock boost analytics data
interface MockBoostData {
  id: string;
  taskId: string;
  taskTitle: string;
  tier: BoostTier;
  ownerId: string;
  durationHours: number;
  priceAmount: number;
  startsAt: string;
  expiresAt: string;
  paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded';
  impressionsBefore: number;
  impressionsDuring: number;
  clicksBefore: number;
  clicksDuring: number;
  claimsDuring: number;
  avgQueuePosition: number;
  wasCompleted: boolean;
  taskReward: number;
}

const mockBoostAnalytics: MockBoostData[] = [
  {
    id: 'boost-001',
    taskId: 'task-002',
    taskTitle: 'Add dark mode support to dashboard components',
    tier: 'featured',
    ownerId: 'agent-001',
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
    avgQueuePosition: 3,
    wasCompleted: false,
    taskReward: 15000, // 150 points = 15000 cents equivalent
  },
  {
    id: 'boost-002',
    taskId: 'task-004',
    taskTitle: 'Implement WebSocket real-time notifications',
    tier: 'urgent',
    ownerId: 'agent-003',
    durationHours: 168,
    priceAmount: 5593,
    startsAt: '2025-01-20T10:00:00Z',
    expiresAt: '2025-01-27T10:00:00Z',
    paymentStatus: 'completed',
    impressionsBefore: 120,
    impressionsDuring: 890,
    clicksBefore: 35,
    clicksDuring: 210,
    claimsDuring: 5,
    avgQueuePosition: 2,
    wasCompleted: false,
    taskReward: 75000, // $750 USDC
  },
  {
    id: 'boost-003',
    taskId: 'task-004',
    taskTitle: 'Implement WebSocket real-time notifications',
    tier: 'premium',
    ownerId: 'agent-003',
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
    avgQueuePosition: 1,
    wasCompleted: false,
    taskReward: 75000,
  },
  {
    id: 'boost-004',
    taskId: 'task-old-001',
    taskTitle: 'Setup CI/CD pipeline',
    tier: 'featured',
    ownerId: 'agent-001',
    durationHours: 72,
    priceAmount: 1347,
    startsAt: '2025-01-10T10:00:00Z',
    expiresAt: '2025-01-13T10:00:00Z',
    paymentStatus: 'completed',
    impressionsBefore: 30,
    impressionsDuring: 95,
    clicksBefore: 8,
    clicksDuring: 28,
    claimsDuring: 1,
    avgQueuePosition: 5,
    wasCompleted: true,
    taskReward: 25000,
  },
];

/**
 * GET /api/boost/analytics - Get boost analytics for the authenticated user
 *
 * Query params:
 * - taskId: Filter by specific task
 * - startDate: Filter by date range start
 * - endDate: Filter by date range end
 * - tier: Filter by boost tier
 */
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);

  // Check if IP is blocked
  if (isIpBlocked(clientId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Rate limiting
  const rateLimit = checkRateLimit(clientId, {
    maxRequests: 50,
    windowMs: 60000,
  });

  if (!rateLimit.allowed) {
    logRateLimitExceeded(request, '/api/boost/analytics', undefined);
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Authenticate request
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated || !authResult.agent) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    );
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const parsed = analyticsQuerySchema.safeParse(queryParams);

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

  // Filter boost data for this user
  let userBoosts = mockBoostAnalytics.filter(
    (b) => b.ownerId === authResult.agent!.id
  );

  // Apply additional filters
  if (filters.taskId) {
    userBoosts = userBoosts.filter((b) => b.taskId === filters.taskId);
  }

  if (filters.tier) {
    userBoosts = userBoosts.filter((b) => b.tier === filters.tier);
  }

  if (filters.startDate) {
    const start = new Date(filters.startDate);
    userBoosts = userBoosts.filter((b) => new Date(b.startsAt) >= start);
  }

  if (filters.endDate) {
    const end = new Date(filters.endDate);
    userBoosts = userBoosts.filter((b) => new Date(b.startsAt) <= end);
  }

  // Calculate analytics for each boost
  const boostAnalytics = userBoosts.map((boost) => {
    const summary = calculateAnalyticsSummary({
      impressionsBefore: boost.impressionsBefore,
      impressionsDuring: boost.impressionsDuring,
      clicksBefore: boost.clicksBefore,
      clicksDuring: boost.clicksDuring,
      claimsDuring: boost.claimsDuring,
      avgQueuePosition: boost.avgQueuePosition,
      totalSpend: boost.priceAmount,
      taskReward: boost.taskReward,
      wasCompleted: boost.wasCompleted,
    });

    const effectiveness = getBoostEffectivenessRating(summary);

    return {
      boostId: boost.id,
      taskId: boost.taskId,
      taskTitle: boost.taskTitle,
      tier: boost.tier,
      tierInfo: BOOST_TIERS[boost.tier],
      duration: {
        hours: boost.durationHours,
        startsAt: boost.startsAt,
        expiresAt: boost.expiresAt,
        isActive: new Date(boost.expiresAt) > new Date(),
      },
      cost: {
        amount: boost.priceAmount,
        formatted: formatPrice(boost.priceAmount),
      },
      analytics: summary,
      effectiveness,
    };
  });

  // Calculate aggregate stats
  const totalSpend = userBoosts.reduce((sum, b) => sum + b.priceAmount, 0);
  const totalImpressions = userBoosts.reduce((sum, b) => sum + b.impressionsDuring, 0);
  const totalClicks = userBoosts.reduce((sum, b) => sum + b.clicksDuring, 0);
  const totalClaims = userBoosts.reduce((sum, b) => sum + b.claimsDuring, 0);
  const completedTasks = userBoosts.filter((b) => b.wasCompleted).length;

  // Tier breakdown
  const tierBreakdown = (
    ['featured', 'urgent', 'premium'] as BoostTier[]
  ).map((tier) => {
    const tierBoosts = userBoosts.filter((b) => b.tier === tier);
    return {
      tier,
      tierInfo: BOOST_TIERS[tier],
      count: tierBoosts.length,
      totalSpend: tierBoosts.reduce((sum, b) => sum + b.priceAmount, 0),
      totalSpendFormatted: formatPrice(
        tierBoosts.reduce((sum, b) => sum + b.priceAmount, 0)
      ),
      avgImpressions:
        tierBoosts.length > 0
          ? Math.round(
              tierBoosts.reduce((sum, b) => sum + b.impressionsDuring, 0) /
                tierBoosts.length
            )
          : 0,
      avgCtr:
        tierBoosts.length > 0
          ? Math.round(
              (tierBoosts.reduce(
                (sum, b) =>
                  sum +
                  (b.impressionsDuring > 0
                    ? b.clicksDuring / b.impressionsDuring
                    : 0),
                0
              ) /
                tierBoosts.length) *
                10000
            ) / 100
          : 0,
    };
  });

  return NextResponse.json({
    summary: {
      totalBoosts: userBoosts.length,
      activeBoosts: userBoosts.filter((b) => new Date(b.expiresAt) > new Date()).length,
      totalSpend: {
        amount: totalSpend,
        formatted: formatPrice(totalSpend),
      },
      totalImpressions,
      totalClicks,
      totalClaims,
      completedTasks,
      overallCtr:
        totalImpressions > 0
          ? Math.round((totalClicks / totalImpressions) * 10000) / 100
          : 0,
      overallConversionRate:
        totalClicks > 0
          ? Math.round((totalClaims / totalClicks) * 10000) / 100
          : 0,
    },
    tierBreakdown,
    boosts: boostAnalytics,
    recommendations: generateRecommendations(userBoosts, boostAnalytics),
  });
}

/**
 * Generate personalized recommendations based on analytics
 */
function generateRecommendations(
  boosts: MockBoostData[],
  analytics: ReturnType<typeof calculateAnalyticsSummary>[]
): string[] {
  const recommendations: string[] = [];

  if (boosts.length === 0) {
    recommendations.push(
      'Start with a Featured boost to see how your tasks perform with increased visibility.'
    );
    return recommendations;
  }

  // Check average CTR
  const avgCtr =
    analytics.reduce(
      (sum, a) => sum + (typeof a === 'object' && 'analytics' in a ? (a.analytics as { clickThroughRate: number }).clickThroughRate : 0),
      0
    ) / analytics.length;

  if (avgCtr < 2) {
    recommendations.push(
      'Your click-through rate is below average. Consider improving task titles to be more descriptive and compelling.'
    );
  }

  // Check tier usage
  const featuredCount = boosts.filter((b) => b.tier === 'featured').length;
  const premiumCount = boosts.filter((b) => b.tier === 'premium').length;

  if (featuredCount > 0 && premiumCount === 0) {
    recommendations.push(
      'Try Premium tier for high-priority tasks - it offers 8x visibility and top placement.'
    );
  }

  // Check duration patterns
  const shortBoosts = boosts.filter((b) => b.durationHours <= 72).length;
  if (shortBoosts / boosts.length > 0.7) {
    recommendations.push(
      'Consider longer boost durations (7+ days) for better value - you can save up to 40% with a 30-day boost.'
    );
  }

  // Check completion rate
  const completedCount = boosts.filter((b) => b.wasCompleted).length;
  if (completedCount / boosts.length > 0.5) {
    recommendations.push(
      'Great completion rate! Boosts are working well for your tasks.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Your boost strategy is performing well. Keep monitoring analytics to optimize further.'
    );
  }

  return recommendations;
}
