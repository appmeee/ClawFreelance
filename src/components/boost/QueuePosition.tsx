'use client';

import { TrendingUpIcon, TrendingDownIcon } from '@/components/icons';

interface QueuePositionProps {
  position: number;
  total: number;
  percentile?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Format ordinal position (1st, 2nd, 3rd, etc.)
 */
function formatOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Get color based on position percentile
 */
function getPositionColor(percentile: number): string {
  if (percentile <= 10) return 'var(--status-success)'; // Top 10%
  if (percentile <= 25) return 'var(--accent-cyan)'; // Top 25%
  if (percentile <= 50) return 'var(--accent-amber)'; // Top 50%
  return 'var(--text-muted)'; // Bottom half
}

const sizeConfig = {
  sm: { text: 'text-xs', badge: 'text-sm', padding: 'px-2 py-1' },
  md: { text: 'text-sm', badge: 'text-lg', padding: 'px-3 py-1.5' },
  lg: { text: 'text-base', badge: 'text-xl', padding: 'px-4 py-2' },
};

export function QueuePosition({
  position,
  total,
  percentile,
  showProgress = false,
  size = 'md',
  className = '',
}: QueuePositionProps) {
  const calculatedPercentile = percentile || Math.round((position / total) * 100);
  const color = getPositionColor(calculatedPercentile);
  const sizeStyles = sizeConfig[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center gap-1 rounded-lg font-mono ${sizeStyles.padding}`}
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <span className={`font-bold ${sizeStyles.badge}`} style={{ color }}>
          #{position}
        </span>
        <span className={sizeStyles.text} style={{ color: 'var(--text-muted)' }}>
          of {total}
        </span>
      </div>

      {showProgress && (
        <div className="flex items-center gap-1">
          {calculatedPercentile <= 25 ? (
            <TrendingUpIcon size={14} style={{ color }} />
          ) : calculatedPercentile >= 75 ? (
            <TrendingDownIcon size={14} style={{ color }} />
          ) : null}
          <span className={`${sizeStyles.text}`} style={{ color }}>
            Top {calculatedPercentile}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact queue position display for task cards
 */
export function QueuePositionBadge({
  position,
  total,
}: {
  position: number;
  total: number;
}) {
  const percentile = Math.round((position / total) * 100);
  const color = getPositionColor(percentile);

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
      style={{ background: 'var(--bg-tertiary)' }}
      title={`Position ${position} of ${total} tasks (Top ${percentile}%)`}
    >
      <span style={{ color }}>#{position}</span>
      <span style={{ color: 'var(--text-muted)' }}>/{total}</span>
    </div>
  );
}

/**
 * Full queue position card with details
 */
export function QueuePositionCard({
  position,
  total,
  estimatedImpressions,
  previousPosition,
  className = '',
}: {
  position: number;
  total: number;
  estimatedImpressions?: number;
  previousPosition?: number;
  className?: string;
}) {
  const percentile = Math.round((position / total) * 100);
  const color = getPositionColor(percentile);
  const positionChange = previousPosition ? previousPosition - position : 0;

  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Queue Position
        </h3>
        {positionChange !== 0 && (
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: positionChange > 0 ? 'var(--status-success)' : 'var(--status-error)' }}
          >
            {positionChange > 0 ? (
              <>
                <TrendingUpIcon size={12} />
                <span>+{positionChange}</span>
              </>
            ) : (
              <>
                <TrendingDownIcon size={12} />
                <span>{positionChange}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-end gap-3 mb-3">
        <span className="text-3xl font-bold font-mono" style={{ color }}>
          {formatOrdinal(position)}
        </span>
        <span className="text-sm pb-1" style={{ color: 'var(--text-muted)' }}>
          out of {total} tasks
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${100 - percentile}%`,
              background: color,
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          <span>Top</span>
          <span>Top {percentile}%</span>
        </div>
      </div>

      {estimatedImpressions !== undefined && (
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Est. Daily Impressions
          </span>
          <span className="font-semibold" style={{ color }}>
            ~{estimatedImpressions.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

export default QueuePosition;
