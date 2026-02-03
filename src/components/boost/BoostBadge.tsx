'use client';

import { RocketIcon } from '@/components/icons';

type BoostTier = 'standard' | 'featured' | 'urgent' | 'premium';

interface BoostBadgeProps {
  tier: BoostTier;
  isActive: boolean;
  remainingHours?: number;
  showTime?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const tierConfig: Record<BoostTier, {
  name: string;
  badge: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
}> = {
  standard: {
    name: 'Standard',
    badge: '',
    bgColor: 'transparent',
    textColor: 'var(--text-muted)',
    borderColor: 'var(--border-subtle)',
    glowColor: 'transparent',
  },
  featured: {
    name: 'Featured',
    badge: 'Featured',
    bgColor: 'rgba(0, 245, 212, 0.1)',
    textColor: 'var(--accent-cyan)',
    borderColor: 'var(--accent-cyan)',
    glowColor: 'rgba(0, 245, 212, 0.3)',
  },
  urgent: {
    name: 'Urgent',
    badge: 'Urgent',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    textColor: 'var(--accent-amber)',
    borderColor: 'var(--accent-amber)',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  premium: {
    name: 'Premium',
    badge: 'Premium',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    textColor: 'var(--status-success)',
    borderColor: 'var(--status-success)',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
};

const sizeConfig = {
  sm: { padding: 'px-1.5 py-0.5', text: 'text-[10px]', icon: 10, gap: 'gap-0.5' },
  md: { padding: 'px-2 py-1', text: 'text-xs', icon: 12, gap: 'gap-1' },
  lg: { padding: 'px-3 py-1.5', text: 'text-sm', icon: 14, gap: 'gap-1.5' },
};

export function BoostBadge({
  tier,
  isActive,
  remainingHours,
  showTime = false,
  size = 'md',
  className = '',
}: BoostBadgeProps) {
  // Don't show badge for standard tier or inactive boosts
  if (tier === 'standard' || !isActive) {
    return null;
  }

  const config = tierConfig[tier];
  const sizeStyles = sizeConfig[size];

  const formatTime = (hours: number): string => {
    if (hours <= 0) return 'Expired';
    if (hours < 24) return `${hours}h left`;
    const days = Math.floor(hours / 24);
    const remainingHrs = hours % 24;
    if (remainingHrs > 0) return `${days}d ${remainingHrs}h`;
    return `${days}d left`;
  };

  return (
    <span
      className={`inline-flex items-center ${sizeStyles.gap} ${sizeStyles.padding} rounded-full font-medium ${sizeStyles.text} border ${className}`}
      style={{
        background: config.bgColor,
        color: config.textColor,
        borderColor: config.borderColor,
        boxShadow: `0 0 8px ${config.glowColor}`,
      }}
    >
      <RocketIcon size={sizeStyles.icon} />
      <span>{config.badge}</span>
      {showTime && remainingHours !== undefined && (
        <span className="opacity-75">• {formatTime(remainingHours)}</span>
      )}
    </span>
  );
}

/**
 * Inline boost indicator for compact displays
 */
export function BoostIndicator({
  tier,
  isActive,
}: {
  tier: BoostTier;
  isActive: boolean;
}) {
  if (tier === 'standard' || !isActive) {
    return null;
  }

  const config = tierConfig[tier];

  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full"
      style={{ background: config.bgColor, color: config.textColor }}
      title={`${config.name} Boost`}
    >
      <RocketIcon size={12} />
    </span>
  );
}

/**
 * Animated boost badge for highlighted tasks
 */
export function AnimatedBoostBadge({
  tier,
  isActive,
}: {
  tier: BoostTier;
  isActive: boolean;
}) {
  if (tier === 'standard' || !isActive) {
    return null;
  }

  const config = tierConfig[tier];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border animate-pulse"
      style={{
        background: config.bgColor,
        color: config.textColor,
        borderColor: config.borderColor,
        boxShadow: `0 0 12px ${config.glowColor}`,
      }}
    >
      <RocketIcon size={12} className="animate-bounce" style={{ animationDuration: '2s' }} />
      <span>{config.badge}</span>
    </span>
  );
}

export default BoostBadge;
