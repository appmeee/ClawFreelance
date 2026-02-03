'use client';

import { useState } from 'react';
import { RocketIcon, TrendingUpIcon, ClockIcon, ChartIcon } from '@/components/icons';
import { BoostBadge, BoostModal, QueuePositionCard } from '@/components/boost';

type BoostTier = 'standard' | 'featured' | 'urgent' | 'premium';

interface TaskBoostSectionProps {
  taskId: string;
  taskTitle: string;
  currentTier: BoostTier;
  boostExpiresAt: string | null;
  boostPriority: number;
  isOwner: boolean;
}

const tierConfig: Record<BoostTier, { name: string; color: string; badge: string }> = {
  standard: { name: 'Standard', color: 'var(--text-muted)', badge: '' },
  featured: { name: 'Featured', color: 'var(--accent-cyan)', badge: 'Featured' },
  urgent: { name: 'Urgent', color: 'var(--accent-amber)', badge: 'Urgent' },
  premium: { name: 'Premium', color: 'var(--status-success)', badge: 'Premium' },
};

export default function TaskBoostSection({
  taskId,
  taskTitle,
  currentTier,
  boostExpiresAt,
  boostPriority,
  isOwner,
}: TaskBoostSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isBoostActive =
    currentTier !== 'standard' &&
    boostExpiresAt &&
    new Date(boostExpiresAt) > new Date();

  const remainingHours = boostExpiresAt
    ? Math.max(0, Math.ceil((new Date(boostExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0;

  const formatTimeRemaining = (hours: number): string => {
    if (hours <= 0) return 'Expired';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    const days = Math.floor(hours / 24);
    const remainingHrs = hours % 24;
    if (remainingHrs > 0) return `${days}d ${remainingHrs}h left`;
    return `${days} day${days > 1 ? 's' : ''} left`;
  };

  // Mock queue position data
  const queuePosition = {
    position: currentTier === 'premium' ? 1 : currentTier === 'urgent' ? 3 : currentTier === 'featured' ? 5 : 15,
    total: 25,
  };

  return (
    <>
      <div
        className="rounded-xl border p-6"
        style={{
          borderColor: isBoostActive ? tierConfig[currentTier].color : 'var(--border-subtle)',
          background: isBoostActive
            ? `linear-gradient(135deg, var(--bg-card) 0%, ${tierConfig[currentTier].color}08 100%)`
            : 'var(--bg-card)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <RocketIcon size={18} style={{ color: 'var(--accent-amber)' }} />
            Boost Status
          </h3>
          {isBoostActive && (
            <BoostBadge
              tier={currentTier}
              isActive={true}
              remainingHours={remainingHours}
              showTime
              size="sm"
            />
          )}
        </div>

        {isBoostActive ? (
          <div className="space-y-4">
            {/* Active Boost Info */}
            <div
              className="p-4 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: 'var(--text-secondary)' }}>Current Tier</span>
                <span className="font-semibold" style={{ color: tierConfig[currentTier].color }}>
                  {tierConfig[currentTier].name}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: 'var(--text-secondary)' }}>Time Remaining</span>
                <span className="flex items-center gap-1">
                  <ClockIcon size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{formatTimeRemaining(remainingHours)}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Priority Score</span>
                <span className="flex items-center gap-1 font-mono">
                  <TrendingUpIcon size={14} style={{ color: 'var(--status-success)' }} />
                  {boostPriority}
                </span>
              </div>
            </div>

            {/* Queue Position */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Queue Position</span>
              <span className="font-mono font-bold" style={{ color: tierConfig[currentTier].color }}>
                #{queuePosition.position}
                <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}> of {queuePosition.total}</span>
              </span>
            </div>

            {/* Upgrade Button */}
            {isOwner && currentTier !== 'premium' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all border hover:bg-[var(--accent-amber)]/10"
                style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
              >
                Upgrade Boost
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* No Boost Info */}
            <div
              className="p-4 rounded-lg text-center"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <RocketIcon size={32} className="mx-auto mb-2 opacity-50" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                This task is not currently boosted
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Queue Position: #{queuePosition.position} of {queuePosition.total}
              </p>
            </div>

            {/* Boost Benefits */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <TrendingUpIcon size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Up to 8x more visibility with Premium boost
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ChartIcon size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Track impressions, clicks, and claims with analytics
                </span>
              </div>
            </div>

            {/* Boost Button */}
            {isOwner && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all text-[var(--bg-primary)]"
                style={{ background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-amber-dim))' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <RocketIcon size={18} />
                  Boost This Task
                </span>
              </button>
            )}

            {!isOwner && (
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Only the task owner can boost this task
              </p>
            )}
          </div>
        )}
      </div>

      {/* Boost Modal */}
      <BoostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskId={taskId}
        taskTitle={taskTitle}
        currentTier={currentTier}
        onBoostSuccess={(boostData) => {
          console.log('Boost created:', boostData);
          // In production, refresh task data
        }}
      />
    </>
  );
}
