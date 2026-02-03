'use client';

import { useState, useEffect } from 'react';
import {
  RocketIcon,
  TrendingUpIcon,
  EyeIcon,
  ClockIcon,
  CheckIcon,
} from '@/components/icons';

interface BoostAnalyticsSummary {
  totalBoosts: number;
  activeBoosts: number;
  totalSpend: {
    amount: number;
    formatted: string;
  };
  totalImpressions: number;
  totalClicks: number;
  totalClaims: number;
  completedTasks: number;
  overallCtr: number;
  overallConversionRate: number;
}

interface TierBreakdown {
  tier: string;
  tierInfo: {
    name: string;
    color: string;
  };
  count: number;
  totalSpend: number;
  totalSpendFormatted: string;
  avgImpressions: number;
  avgCtr: number;
}

interface BoostRecord {
  boostId: string;
  taskId: string;
  taskTitle: string;
  tier: string;
  tierInfo: {
    name: string;
    color: string;
  };
  duration: {
    hours: number;
    startsAt: string;
    expiresAt: string;
    isActive: boolean;
  };
  cost: {
    amount: number;
    formatted: string;
  };
  analytics: {
    totalImpressions: number;
    totalClicks: number;
    totalClaims: number;
    clickThroughRate: number;
    conversionRate: number;
    avgQueuePosition: number;
    impressionLift: number;
    roi: number;
  };
  effectiveness: {
    rating: 'excellent' | 'good' | 'average' | 'poor';
    score: number;
    message: string;
  };
}

interface AnalyticsData {
  summary: BoostAnalyticsSummary;
  tierBreakdown: TierBreakdown[];
  boosts: BoostRecord[];
  recommendations: string[];
}

interface BoostAnalyticsProps {
  className?: string;
}

const effectivenessColors = {
  excellent: 'var(--status-success)',
  good: 'var(--accent-cyan)',
  average: 'var(--accent-amber)',
  poor: 'var(--status-error)',
};

export function BoostAnalytics({ className = '' }: BoostAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/boost/analytics', {
          headers: {
            // In production, include auth header
          },
        });
        const result = await response.json();
        if (response.ok) {
          setData(result);
        } else {
          setError(result.error || 'Failed to fetch analytics');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className={`rounded-xl border p-8 text-center ${className}`} style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
        <div className="inline-block w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border p-8 ${className}`} style={{ borderColor: 'var(--status-error)', background: 'rgba(255, 68, 102, 0.1)' }}>
        <p style={{ color: 'var(--status-error)' }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { summary, tierBreakdown, boosts, recommendations } = data;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<RocketIcon size={20} style={{ color: 'var(--accent-amber)' }} />}
          label="Total Boosts"
          value={summary.totalBoosts.toString()}
          subValue={`${summary.activeBoosts} active`}
        />
        <StatCard
          icon={<span style={{ color: 'var(--status-success)' }}>$</span>}
          label="Total Spend"
          value={summary.totalSpend.formatted}
        />
        <StatCard
          icon={<EyeIcon size={20} style={{ color: 'var(--accent-cyan)' }} />}
          label="Total Impressions"
          value={summary.totalImpressions.toLocaleString()}
          subValue={`${summary.overallCtr}% CTR`}
        />
        <StatCard
          icon={<CheckIcon size={20} style={{ color: 'var(--status-success)' }} />}
          label="Tasks Claimed"
          value={summary.totalClaims.toString()}
          subValue={`${summary.completedTasks} completed`}
        />
      </div>

      {/* Tier Breakdown */}
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
        <h3 className="text-lg font-semibold mb-4">Performance by Tier</h3>
        <div className="grid gap-4">
          {tierBreakdown.map((tier) => (
            <div
              key={tier.tier}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: tier.tierInfo.color }}
                />
                <div>
                  <div className="font-medium">{tier.tierInfo.name}</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {tier.count} boost{tier.count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <div style={{ color: 'var(--text-muted)' }}>Spent</div>
                  <div className="font-semibold">{tier.totalSpendFormatted}</div>
                </div>
                <div className="text-right">
                  <div style={{ color: 'var(--text-muted)' }}>Avg. Impressions</div>
                  <div className="font-semibold">{tier.avgImpressions.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div style={{ color: 'var(--text-muted)' }}>Avg. CTR</div>
                  <div className="font-semibold">{tier.avgCtr}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--accent-cyan)', background: 'rgba(0, 245, 212, 0.05)' }}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUpIcon size={20} style={{ color: 'var(--accent-cyan)' }} />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-cyan)' }}>•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Boosts */}
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
        <h3 className="text-lg font-semibold mb-4">Boost History</h3>
        <div className="space-y-4">
          {boosts.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <RocketIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>No boosts yet. Boost a task to see analytics here.</p>
            </div>
          ) : (
            boosts.map((boost) => (
              <BoostHistoryCard key={boost.boostId} boost={boost} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subValue && (
        <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subValue}</div>
      )}
    </div>
  );
}

function BoostHistoryCard({ boost }: { boost: BoostRecord }) {
  const effectivenessColor = effectivenessColors[boost.effectiveness.rating];

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-tertiary)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: `${boost.tierInfo.color}20`, color: boost.tierInfo.color }}
            >
              {boost.tierInfo.name}
            </span>
            {boost.duration.isActive && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--status-success)]/10 text-[var(--status-success)]">
                Active
              </span>
            )}
          </div>
          <h4 className="font-medium line-clamp-1">{boost.taskTitle}</h4>
          <div className="flex items-center gap-2 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <ClockIcon size={12} />
            <span>{boost.duration.hours} hours</span>
            <span>•</span>
            <span>{boost.cost.formatted}</span>
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-xs font-medium px-2 py-1 rounded"
            style={{ background: `${effectivenessColor}20`, color: effectivenessColor }}
          >
            {boost.effectiveness.rating.charAt(0).toUpperCase() + boost.effectiveness.rating.slice(1)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Score: {boost.effectiveness.score}/100
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <div style={{ color: 'var(--text-muted)' }}>Impressions</div>
          <div className="font-semibold">{boost.analytics.totalImpressions.toLocaleString()}</div>
          {boost.analytics.impressionLift > 0 && (
            <div className="text-xs text-[var(--status-success)]">+{boost.analytics.impressionLift}%</div>
          )}
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)' }}>Clicks</div>
          <div className="font-semibold">{boost.analytics.totalClicks}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{boost.analytics.clickThroughRate}% CTR</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)' }}>Claims</div>
          <div className="font-semibold">{boost.analytics.totalClaims}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{boost.analytics.conversionRate}% conv.</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)' }}>Avg. Position</div>
          <div className="font-semibold">#{boost.analytics.avgQueuePosition}</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t text-sm" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
        {boost.effectiveness.message}
      </div>
    </div>
  );
}

export default BoostAnalytics;
