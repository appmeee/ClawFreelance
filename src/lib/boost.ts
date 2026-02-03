/**
 * Task Boost System - Priority Queue for Task Visibility
 *
 * This module provides pricing, tiers, duration settings, and analytics
 * calculations for the task boost feature.
 */

// ============================================================================
// Types
// ============================================================================

export type BoostTier = 'standard' | 'featured' | 'urgent' | 'premium';
export type BoostPaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface BoostTierConfig {
  tier: BoostTier;
  name: string;
  description: string;
  visibilityMultiplier: number; // How much more visible the task is
  priorityScore: number; // Base priority score for sorting
  highlighted: boolean; // Whether task gets visual highlight
  topPlacement: boolean; // Whether task appears in top section
  badge: string; // Badge text to display
  color: string; // Theme color for the tier
}

export interface BoostDuration {
  hours: number;
  label: string;
  discount: number; // Percentage discount for longer durations
}

export interface BoostPricing {
  tier: BoostTier;
  durationHours: number;
  basePrice: number; // Price in cents
  discountedPrice: number; // Price after duration discount
  currency: string;
}

export interface BoostAnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalClaims: number;
  clickThroughRate: number; // CTR percentage
  conversionRate: number; // Claims / Clicks percentage
  avgQueuePosition: number;
  impressionLift: number; // Percentage increase vs. before boost
  roi: number; // Return on investment (if task was completed)
}

export interface TaskBoostInfo {
  taskId: string;
  currentTier: BoostTier;
  isActive: boolean;
  expiresAt: string | null;
  remainingHours: number;
  queuePosition: number;
  totalSpend: number;
}

export interface QueuePositionInfo {
  position: number;
  totalTasks: number;
  percentile: number; // Top X%
  tasksAhead: number;
  estimatedImpressions: number; // Based on position
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Boost tier configurations
 * Each tier provides different visibility benefits
 */
export const BOOST_TIERS: Record<BoostTier, BoostTierConfig> = {
  standard: {
    tier: 'standard',
    name: 'Standard',
    description: 'Default visibility with no boost',
    visibilityMultiplier: 1,
    priorityScore: 0,
    highlighted: false,
    topPlacement: false,
    badge: '',
    color: 'var(--text-muted)',
  },
  featured: {
    tier: 'featured',
    name: 'Featured',
    description: '2x visibility boost with a featured badge',
    visibilityMultiplier: 2,
    priorityScore: 100,
    highlighted: false,
    topPlacement: false,
    badge: 'Featured',
    color: 'var(--accent-cyan)',
  },
  urgent: {
    tier: 'urgent',
    name: 'Urgent',
    description: '4x visibility with highlighted appearance',
    visibilityMultiplier: 4,
    priorityScore: 250,
    highlighted: true,
    topPlacement: false,
    badge: 'Urgent',
    color: 'var(--accent-amber)',
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    description: '8x visibility with top placement and premium styling',
    visibilityMultiplier: 8,
    priorityScore: 500,
    highlighted: true,
    topPlacement: true,
    badge: 'Premium',
    color: 'var(--status-success)',
  },
};

/**
 * Available boost durations
 * Longer durations get discounts
 */
export const BOOST_DURATIONS: BoostDuration[] = [
  { hours: 24, label: '1 Day', discount: 0 },
  { hours: 72, label: '3 Days', discount: 10 },
  { hours: 168, label: '7 Days', discount: 20 },
  { hours: 336, label: '14 Days', discount: 30 },
  { hours: 720, label: '30 Days', discount: 40 },
];

/**
 * Base pricing per tier (in USD cents, per 24 hours)
 */
export const BASE_PRICES: Record<BoostTier, number> = {
  standard: 0,
  featured: 499, // $4.99 per day
  urgent: 999, // $9.99 per day
  premium: 1999, // $19.99 per day
};

/**
 * Supported currencies for boost payments
 */
export const SUPPORTED_CURRENCIES = ['USD', 'USDC', 'ETH', 'SOL'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// ============================================================================
// Pricing Functions
// ============================================================================

/**
 * Calculate the price for a boost
 */
export function calculateBoostPrice(
  tier: BoostTier,
  durationHours: number,
  currency: SupportedCurrency = 'USD'
): BoostPricing {
  const basePrice = BASE_PRICES[tier];
  const days = durationHours / 24;
  const totalBasePrice = Math.round(basePrice * days);

  // Find applicable discount
  const duration = BOOST_DURATIONS.find((d) => d.hours === durationHours);
  const discount = duration?.discount || 0;

  const discountedPrice = Math.round(totalBasePrice * (1 - discount / 100));

  return {
    tier,
    durationHours,
    basePrice: totalBasePrice,
    discountedPrice,
    currency,
  };
}

/**
 * Get all pricing options for a specific tier
 */
export function getTierPricingOptions(tier: BoostTier): BoostPricing[] {
  return BOOST_DURATIONS.map((duration) =>
    calculateBoostPrice(tier, duration.hours)
  );
}

/**
 * Get complete pricing matrix for all tiers and durations
 */
export function getFullPricingMatrix(): Record<BoostTier, BoostPricing[]> {
  return {
    standard: getTierPricingOptions('standard'),
    featured: getTierPricingOptions('featured'),
    urgent: getTierPricingOptions('urgent'),
    premium: getTierPricingOptions('premium'),
  };
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  if (cents === 0) return 'Free';

  const amount = cents / 100;
  if (currency === 'USD' || currency === 'USDC') {
    return `$${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(4)} ${currency}`;
}

// ============================================================================
// Priority Score Calculation
// ============================================================================

/**
 * Calculate the priority score for a task
 * Higher scores = higher visibility in queue
 *
 * Factors:
 * - Boost tier (primary factor)
 * - Time remaining on boost (fresher boosts rank higher)
 * - Task freshness (newer tasks get slight bump)
 * - Reward amount (higher rewards get slight bump)
 */
export function calculatePriorityScore(
  tier: BoostTier,
  boostExpiresAt: Date | null,
  taskCreatedAt: Date,
  rewardAmount: number = 0
): number {
  const now = new Date();

  // Base score from tier
  let score = BOOST_TIERS[tier].priorityScore;

  // Add time-based score for active boosts (favors boosts about to expire less)
  if (boostExpiresAt && boostExpiresAt > now) {
    const hoursRemaining = Math.max(
      0,
      (boostExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
    );
    // Max 50 points for fresh boosts, decays over time
    score += Math.min(50, hoursRemaining / 10);
  }

  // Task freshness bonus (max 20 points for tasks < 24 hours old)
  const taskAgeHours =
    (now.getTime() - taskCreatedAt.getTime()) / (1000 * 60 * 60);
  if (taskAgeHours < 24) {
    score += Math.round(20 * (1 - taskAgeHours / 24));
  }

  // Reward amount bonus (max 30 points)
  if (rewardAmount > 0) {
    // Log scale: $100 = ~15 points, $1000 = ~30 points
    score += Math.min(30, Math.round(Math.log10(rewardAmount) * 10));
  }

  return Math.round(score);
}

/**
 * Check if a boost is currently active
 */
export function isBoostActive(
  tier: BoostTier,
  expiresAt: Date | null
): boolean {
  if (tier === 'standard') return false;
  if (!expiresAt) return false;
  return new Date() < expiresAt;
}

/**
 * Get remaining hours for a boost
 */
export function getBoostRemainingHours(expiresAt: Date | null): number {
  if (!expiresAt) return 0;
  const now = new Date();
  const remaining = Math.max(0, expiresAt.getTime() - now.getTime());
  return Math.ceil(remaining / (1000 * 60 * 60));
}

// ============================================================================
// Queue Position Functions
// ============================================================================

/**
 * Calculate queue position info for a task
 * Lower position = better visibility
 */
export function calculateQueuePosition(
  taskPriority: number,
  allPriorities: number[]
): QueuePositionInfo {
  const sorted = [...allPriorities].sort((a, b) => b - a);
  const position = sorted.indexOf(taskPriority) + 1;
  const totalTasks = sorted.length;
  const percentile = Math.round((position / totalTasks) * 100);

  // Estimate impressions based on position (top positions get exponentially more)
  const baseImpressions = 1000; // Assumed daily impressions for top task
  const estimatedImpressions = Math.round(
    baseImpressions * Math.pow(0.8, position - 1)
  );

  return {
    position,
    totalTasks,
    percentile,
    tasksAhead: position - 1,
    estimatedImpressions,
  };
}

/**
 * Format queue position for display
 */
export function formatQueuePosition(position: number): string {
  if (position === 1) return '1st';
  if (position === 2) return '2nd';
  if (position === 3) return '3rd';
  return `${position}th`;
}

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Calculate analytics summary for a boost
 */
export function calculateAnalyticsSummary(data: {
  impressionsBefore: number;
  impressionsDuring: number;
  clicksBefore: number;
  clicksDuring: number;
  claimsDuring: number;
  avgQueuePosition: number;
  totalSpend: number;
  taskReward: number;
  wasCompleted: boolean;
}): BoostAnalyticsSummary {
  const {
    impressionsBefore,
    impressionsDuring,
    clicksBefore,
    clicksDuring,
    claimsDuring,
    avgQueuePosition,
    totalSpend,
    taskReward,
    wasCompleted,
  } = data;

  // Click-through rate
  const ctr =
    impressionsDuring > 0
      ? Math.round((clicksDuring / impressionsDuring) * 10000) / 100
      : 0;

  // Conversion rate (claims per click)
  const conversionRate =
    clicksDuring > 0
      ? Math.round((claimsDuring / clicksDuring) * 10000) / 100
      : 0;

  // Impression lift (percentage increase)
  const impressionLift =
    impressionsBefore > 0
      ? Math.round(
          ((impressionsDuring - impressionsBefore) / impressionsBefore) * 100
        )
      : impressionsDuring > 0
        ? 100
        : 0;

  // ROI calculation (if task was completed and had a reward)
  let roi = 0;
  if (wasCompleted && totalSpend > 0) {
    // Simple ROI: (value gained - cost) / cost * 100
    // Value gained = task got completed faster (hard to quantify)
    // Using completion as proxy: if completed, ROI = reward value vs spend
    roi = Math.round(((taskReward - totalSpend / 100) / (totalSpend / 100)) * 100);
  }

  return {
    totalImpressions: impressionsDuring,
    totalClicks: clicksDuring,
    totalClaims: claimsDuring,
    clickThroughRate: ctr,
    conversionRate,
    avgQueuePosition,
    impressionLift,
    roi,
  };
}

/**
 * Get effectiveness rating based on analytics
 */
export function getBoostEffectivenessRating(
  analytics: BoostAnalyticsSummary
): {
  rating: 'excellent' | 'good' | 'average' | 'poor';
  score: number;
  message: string;
} {
  let score = 0;

  // Score based on CTR (industry average ~2%)
  if (analytics.clickThroughRate >= 5) score += 30;
  else if (analytics.clickThroughRate >= 3) score += 20;
  else if (analytics.clickThroughRate >= 1) score += 10;

  // Score based on impression lift
  if (analytics.impressionLift >= 200) score += 30;
  else if (analytics.impressionLift >= 100) score += 20;
  else if (analytics.impressionLift >= 50) score += 10;

  // Score based on claims
  if (analytics.totalClaims >= 3) score += 40;
  else if (analytics.totalClaims >= 1) score += 25;
  else if (analytics.totalClicks >= 10) score += 10;

  let rating: 'excellent' | 'good' | 'average' | 'poor';
  let message: string;

  if (score >= 80) {
    rating = 'excellent';
    message = 'Outstanding boost performance! Your task got great visibility.';
  } else if (score >= 50) {
    rating = 'good';
    message = 'Good boost results. Your task received increased attention.';
  } else if (score >= 25) {
    rating = 'average';
    message = 'Average performance. Consider optimizing your task description.';
  } else {
    rating = 'poor';
    message = 'Below expected results. Try a different tier or improve task details.';
  }

  return { rating, score, message };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate boost tier
 */
export function isValidBoostTier(tier: string): tier is BoostTier {
  return ['standard', 'featured', 'urgent', 'premium'].includes(tier);
}

/**
 * Validate boost duration
 */
export function isValidBoostDuration(hours: number): boolean {
  return BOOST_DURATIONS.some((d) => d.hours === hours);
}

/**
 * Validate currency
 */
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get tier display info
 */
export function getTierDisplayInfo(tier: BoostTier): BoostTierConfig {
  return BOOST_TIERS[tier];
}

/**
 * Get duration display info
 */
export function getDurationDisplayInfo(hours: number): BoostDuration | undefined {
  return BOOST_DURATIONS.find((d) => d.hours === hours);
}

/**
 * Format duration for display
 */
export function formatBoostDuration(hours: number): string {
  if (hours < 24) return `${hours} hours`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * Get time remaining display string
 */
export function formatTimeRemaining(expiresAt: Date | null): string {
  if (!expiresAt) return 'Not boosted';

  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return remainingHours > 0
      ? `${days}d ${remainingHours}h remaining`
      : `${days} day${days > 1 ? 's' : ''} remaining`;
  }

  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
}

/**
 * Check if user can boost a task (ownership validation done elsewhere)
 */
export function canBoostTask(
  currentTier: BoostTier,
  expiresAt: Date | null,
  targetTier: BoostTier
): { canBoost: boolean; reason?: string } {
  // Can always boost to standard (cancel boost)
  if (targetTier === 'standard') {
    return { canBoost: true };
  }

  // Can't boost to same tier if already active
  if (currentTier === targetTier && isBoostActive(currentTier, expiresAt)) {
    return {
      canBoost: false,
      reason: 'Task already has this boost tier active. Wait for it to expire or upgrade.',
    };
  }

  // Can upgrade tier even with active boost
  const currentPriority = BOOST_TIERS[currentTier].priorityScore;
  const targetPriority = BOOST_TIERS[targetTier].priorityScore;

  if (isBoostActive(currentTier, expiresAt) && targetPriority < currentPriority) {
    return {
      canBoost: false,
      reason: 'Cannot downgrade to a lower tier while current boost is active.',
    };
  }

  return { canBoost: true };
}
