'use client';

import { useState, useEffect } from 'react';
import { RocketIcon, CloseIcon, CheckIcon, ClockIcon } from '@/components/icons';

type BoostTier = 'featured' | 'urgent' | 'premium';

interface BoostPricing {
  durationHours: number;
  durationLabel: string;
  basePrice: number;
  discountedPrice: number;
  discount: number;
  savings: number;
}

interface TierInfo {
  tier: string;
  name: string;
  description: string;
  benefits: {
    visibilityMultiplier: number;
    highlighted: boolean;
    topPlacement: boolean;
    badge: string;
  };
  color: string;
  pricing: BoostPricing[];
}

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  currentTier?: BoostTier | 'standard';
  onBoostSuccess?: (boostData: { tier: BoostTier; durationHours: number }) => void;
}

const tierStyles: Record<BoostTier, { bg: string; border: string; text: string; glow: string }> = {
  featured: {
    bg: 'rgba(0, 245, 212, 0.1)',
    border: 'var(--accent-cyan)',
    text: 'var(--accent-cyan)',
    glow: 'rgba(0, 245, 212, 0.2)',
  },
  urgent: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'var(--accent-amber)',
    text: 'var(--accent-amber)',
    glow: 'rgba(245, 158, 11, 0.2)',
  },
  premium: {
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'var(--status-success)',
    text: 'var(--status-success)',
    glow: 'rgba(16, 185, 129, 0.2)',
  },
};

export function BoostModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  currentTier = 'standard',
  onBoostSuccess,
}: BoostModalProps) {
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [selectedTier, setSelectedTier] = useState<BoostTier>('featured');
  const [selectedDuration, setSelectedDuration] = useState<number>(72); // 3 days default
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch pricing data
  useEffect(() => {
    if (!isOpen) return;

    const fetchPricing = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/boost/pricing');
        const data = await response.json();
        if (response.ok) {
          setTiers(data.tiers);
        } else {
          setError(data.error || 'Failed to fetch pricing');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTier('featured');
      setSelectedDuration(72);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${taskId}/boost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // In production, include auth header
        },
        body: JSON.stringify({
          tier: selectedTier,
          durationHours: selectedDuration,
          currency: 'USD',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        onBoostSuccess?.({ tier: selectedTier, durationHours: selectedDuration });
        // Auto close after success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to boost task');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedTierInfo = tiers.find((t) => t.tier === selectedTier);
  const selectedPricing = selectedTierInfo?.pricing.find(
    (p) => p.durationHours === selectedDuration
  );

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <RocketIcon size={20} style={{ color: 'var(--accent-amber)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Boost Your Task</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Increase visibility with priority placement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <CloseIcon size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>
                Loading pricing...
              </p>
            </div>
          ) : success ? (
            <div className="text-center py-12">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ background: 'rgba(16, 185, 129, 0.1)' }}
              >
                <CheckIcon size={32} style={{ color: 'var(--status-success)' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--status-success)' }}>
                Boost Activated!
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Your task is now boosted with {selectedTierInfo?.name} tier
              </p>
            </div>
          ) : (
            <>
              {/* Task Preview */}
              <div
                className="rounded-xl p-4 mb-6 border"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-tertiary)' }}
              >
                <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                  Boosting Task
                </div>
                <div className="font-semibold line-clamp-1">{taskTitle}</div>
                {currentTier !== 'standard' && (
                  <div className="mt-2 text-sm" style={{ color: 'var(--accent-amber)' }}>
                    Currently has {currentTier} boost
                  </div>
                )}
              </div>

              {error && (
                <div
                  className="rounded-lg p-4 mb-6 border"
                  style={{ borderColor: 'var(--status-error)', background: 'rgba(255, 68, 102, 0.1)' }}
                >
                  <p style={{ color: 'var(--status-error)' }}>{error}</p>
                </div>
              )}

              {/* Tier Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Select Boost Tier</h3>
                <div className="grid gap-3">
                  {tiers.map((tier) => {
                    const isSelected = selectedTier === tier.tier;
                    const style = tierStyles[tier.tier as BoostTier];

                    return (
                      <button
                        key={tier.tier}
                        onClick={() => setSelectedTier(tier.tier as BoostTier)}
                        className={`relative p-4 rounded-xl border text-left transition-all ${
                          isSelected ? 'ring-2' : 'hover:border-[var(--border-medium)]'
                        }`}
                        style={{
                          borderColor: isSelected ? style.border : 'var(--border-subtle)',
                          background: isSelected ? style.bg : 'transparent',
                          ...(isSelected && { boxShadow: `0 0 20px ${style.glow}` }),
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold" style={{ color: style.text }}>
                                {tier.name}
                              </span>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: style.bg, color: style.text }}
                              >
                                {tier.benefits.visibilityMultiplier}x visibility
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {tier.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {tier.benefits.highlighted && (
                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                                  Highlighted
                                </span>
                              )}
                              {tier.benefits.topPlacement && (
                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                                  Top Placement
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                                {tier.benefits.badge} Badge
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-current' : 'border-[var(--border-medium)]'
                            }`}
                            style={{ color: isSelected ? style.text : 'transparent' }}
                          >
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Select Duration</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {selectedTierInfo?.pricing.map((pricing) => {
                    const isSelected = selectedDuration === pricing.durationHours;
                    const style = tierStyles[selectedTier];

                    return (
                      <button
                        key={pricing.durationHours}
                        onClick={() => setSelectedDuration(pricing.durationHours)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          isSelected ? 'ring-2' : 'hover:border-[var(--border-medium)]'
                        }`}
                        style={{
                          borderColor: isSelected ? style.border : 'var(--border-subtle)',
                          background: isSelected ? style.bg : 'transparent',
                        }}
                      >
                        <div className="font-semibold text-sm">{pricing.durationLabel}</div>
                        <div className="text-lg font-bold" style={{ color: style.text }}>
                          {formatPrice(pricing.discountedPrice)}
                        </div>
                        {pricing.discount > 0 && (
                          <div className="text-xs" style={{ color: 'var(--status-success)' }}>
                            Save {pricing.discount}%
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              {selectedPricing && (
                <div
                  className="rounded-xl p-4 mb-6"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {selectedTierInfo?.name} Boost × {selectedPricing.durationLabel}
                    </span>
                    {selectedPricing.discount > 0 && (
                      <span className="line-through text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formatPrice(selectedPricing.basePrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClockIcon size={16} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Starts immediately
                      </span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: tierStyles[selectedTier].text }}>
                      {formatPrice(selectedPricing.discountedPrice)}
                    </span>
                  </div>
                  {selectedPricing.savings > 0 && (
                    <div className="text-right text-sm mt-1" style={{ color: 'var(--status-success)' }}>
                      You save {formatPrice(selectedPricing.savings)}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-lg border font-medium transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{ borderColor: 'var(--border-medium)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{
                    background: tierStyles[selectedTier].bg,
                    border: `1px solid ${tierStyles[selectedTier].border}`,
                    color: tierStyles[selectedTier].text,
                  }}
                >
                  {submitting ? 'Processing...' : `Boost Task • ${formatPrice(selectedPricing?.discountedPrice || 0)}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BoostModal;
