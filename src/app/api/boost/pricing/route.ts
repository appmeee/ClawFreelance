import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, isIpBlocked } from '@/lib/security';
import { logRateLimitExceeded } from '@/lib/audit';
import {
  getFullPricingMatrix,
  formatPrice,
  BOOST_TIERS,
  BOOST_DURATIONS,
  SUPPORTED_CURRENCIES,
  type BoostTier,
} from '@/lib/boost';

/**
 * GET /api/boost/pricing - Get complete pricing information for task boosts
 *
 * Returns all tiers, durations, and pricing options for boosting tasks.
 * No authentication required - public endpoint.
 */
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);

  // Check if IP is blocked
  if (isIpBlocked(clientId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Rate limiting (generous for public endpoint)
  const rateLimit = checkRateLimit(clientId, {
    maxRequests: 60,
    windowMs: 60000,
  });

  if (!rateLimit.allowed) {
    logRateLimitExceeded(request, '/api/boost/pricing', undefined);
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Get complete pricing matrix
  const pricingMatrix = getFullPricingMatrix();

  // Format for response
  const tiers = Object.entries(BOOST_TIERS)
    .filter(([tier]) => tier !== 'standard')
    .map(([tier, config]) => {
      const pricing = pricingMatrix[tier as BoostTier];
      return {
        tier,
        name: config.name,
        description: config.description,
        benefits: {
          visibilityMultiplier: config.visibilityMultiplier,
          highlighted: config.highlighted,
          topPlacement: config.topPlacement,
          badge: config.badge,
        },
        color: config.color,
        pricing: pricing.map((p) => {
          const duration = BOOST_DURATIONS.find((d) => d.hours === p.durationHours);
          return {
            durationHours: p.durationHours,
            durationLabel: duration?.label || `${p.durationHours} hours`,
            basePrice: p.basePrice,
            basePriceFormatted: formatPrice(p.basePrice),
            discountedPrice: p.discountedPrice,
            discountedPriceFormatted: formatPrice(p.discountedPrice),
            discount: duration?.discount || 0,
            savings: p.basePrice - p.discountedPrice,
            savingsFormatted: formatPrice(p.basePrice - p.discountedPrice),
            currency: p.currency,
          };
        }),
      };
    });

  // Build comparison table for quick reference
  const comparisonTable = BOOST_DURATIONS.map((duration) => ({
    duration: duration.label,
    durationHours: duration.hours,
    discount: `${duration.discount}%`,
    tiers: (Object.keys(BOOST_TIERS) as BoostTier[])
      .filter((tier) => tier !== 'standard')
      .reduce((acc, tier) => {
        const pricing = pricingMatrix[tier].find(
          (p) => p.durationHours === duration.hours
        );
        acc[tier] = {
          price: pricing?.discountedPrice || 0,
          priceFormatted: formatPrice(pricing?.discountedPrice || 0),
        };
        return acc;
      }, {} as Record<string, { price: number; priceFormatted: string }>),
  }));

  return NextResponse.json(
    {
      tiers,
      durations: BOOST_DURATIONS.map((d) => ({
        hours: d.hours,
        label: d.label,
        discount: d.discount,
        discountLabel: d.discount > 0 ? `${d.discount}% off` : 'No discount',
      })),
      supportedCurrencies: SUPPORTED_CURRENCIES,
      comparisonTable,
      notes: {
        pricing: 'All prices shown in USD. Crypto payments accepted at current exchange rates.',
        duration: 'Longer durations provide better value with automatic discounts.',
        activation: 'Boosts activate immediately upon successful payment.',
        cancellation: 'Boosts can be cancelled at any time but are non-refundable.',
        stacking: 'Only one boost can be active at a time. Upgrading to a higher tier replaces the current boost.',
      },
      faqs: [
        {
          question: 'What happens when I boost a task?',
          answer: 'Your task gets increased visibility based on the tier selected. Higher tiers appear more prominently in search results and listings.',
        },
        {
          question: 'Can I upgrade my boost?',
          answer: 'Yes, you can upgrade to a higher tier at any time. The new boost will replace your current one.',
        },
        {
          question: 'What happens when my boost expires?',
          answer: 'Your task returns to standard visibility. You can purchase another boost at any time.',
        },
        {
          question: 'Are boosts refundable?',
          answer: 'Boosts are non-refundable once activated. You can cancel early but will not receive a refund.',
        },
      ],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    }
  );
}
