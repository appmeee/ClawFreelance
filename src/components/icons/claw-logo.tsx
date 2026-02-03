'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

interface ClawLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'full' | 'icon';
  animated?: boolean;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

/**
 * ClawFreelance Logo - Freelancer Crab with Laptop
 * A cybernetic crab mascot that embodies the freelance coding spirit
 * Part of the OpenClaw ecosystem with unique cyan color scheme
 */
export function ClawLogo({ className, size = 'md', animated = false }: ClawLogoProps) {
  const dimension = typeof size === 'number' ? size : sizeMap[size];

  // For static logo, use the SVG from public folder
  if (!animated) {
    return (
      <Image
        src="/favicon.svg"
        alt="ClawFreelance"
        width={dimension}
        height={dimension}
        className={cn('flex-shrink-0', className)}
        unoptimized
      />
    );
  }

  // For animated logo, render inline SVG with CSS animations
  // Use a fixed ID since only one animated logo appears per page
  const gradientId = 'claw-gradient-animated';

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 120 120"
      fill="none"
      className={cn('flex-shrink-0', className)}
    >
      <style>{`
        @keyframes clawTypeLeft {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(3px) rotate(-3deg); }
        }
        @keyframes clawTypeRight {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(3px) rotate(3deg); }
        }
        @keyframes antennaBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes codePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .claw-left-${gradientId} { animation: clawTypeLeft 0.4s ease-in-out infinite; transform-origin: 18px 68px; }
        .claw-right-${gradientId} { animation: clawTypeRight 0.4s ease-in-out infinite 0.2s; transform-origin: 102px 68px; }
        .antenna-${gradientId} { animation: antennaBob 3s ease-in-out infinite; }
        .antenna-right-${gradientId} { animation: antennaBob 3s ease-in-out infinite 0.3s; }
        .screen-code-${gradientId} { animation: codePulse 1.5s ease-in-out infinite; }
      `}</style>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-cyan)" />
          <stop offset="100%" stopColor="#00a8bb" />
        </linearGradient>
      </defs>
      {/* Body */}
      <path
        d="M60 15 C30 15 15 35 15 52 C15 68 28 82 45 85 L47 92 L53 92 L53 85 C56 86 64 86 67 85 L67 92 L73 92 L75 85 C92 82 105 68 105 52 C105 35 90 15 60 15Z"
        fill={`url(#${gradientId})`}
      />
      {/* Left Cybernetic Claw */}
      <g className={`claw-left-${gradientId}`}>
        <path d="M18 48 L5 38 L0 44 L10 52 L0 62 L5 68 L18 58 Z" fill={`url(#${gradientId})`} />
        <rect x="12" y="46" width="8" height="14" rx="1" fill={`url(#${gradientId})`} />
      </g>
      {/* Right Cybernetic Claw */}
      <g className={`claw-right-${gradientId}`}>
        <path
          d="M102 48 L115 38 L120 44 L110 52 L120 62 L115 68 L102 58 Z"
          fill={`url(#${gradientId})`}
        />
        <rect x="100" y="46" width="8" height="14" rx="1" fill={`url(#${gradientId})`} />
      </g>
      {/* Antenna */}
      <g className={`antenna-${gradientId}`}>
        <path
          d="M42 20 Q32 8 30 14"
          stroke="var(--accent-cyan)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="30" cy="14" r="3" fill="var(--accent-cyan)" />
      </g>
      <g className={`antenna-right-${gradientId}`}>
        <path
          d="M78 20 Q88 8 90 14"
          stroke="var(--accent-cyan)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="90" cy="14" r="3" fill="var(--accent-cyan)" />
      </g>
      {/* Eyes */}
      <circle cx="42" cy="38" r="7" fill="var(--bg-primary)" />
      <circle cx="78" cy="38" r="7" fill="var(--bg-primary)" />
      <circle cx="44" cy="37" r="3" fill="#f5fbff" />
      <circle cx="80" cy="37" r="3" fill="#f5fbff" />
      {/* Mouth - focused expression */}
      <line
        x1="52"
        y1="58"
        x2="68"
        y2="58"
        stroke="var(--bg-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Laptop */}
      <rect x="35" y="88" width="50" height="22" rx="2" fill="#1a1a22" />
      <rect x="38" y="91" width="44" height="16" rx="1" fill="var(--bg-primary)" />
      <g className={`screen-code-${gradientId}`}>
        <line x1="41" y1="95" x2="52" y2="95" stroke="var(--accent-cyan)" strokeWidth="1.5" />
        <line x1="41" y1="99" x2="58" y2="99" stroke="#00a8bb" strokeWidth="1.5" />
        <line x1="41" y1="103" x2="48" y2="103" stroke="var(--accent-cyan)" strokeWidth="1.5" />
      </g>
      <path d="M32 110 L35 106 L85 106 L88 110 Z" fill="#1a1a22" />
    </svg>
  );
}

/**
 * ClawFreelance Wordmark Logo with icon
 */
export function ClawLogoFull({ className, size = 'md', animated = false }: ClawLogoProps) {
  const dimension = typeof size === 'number' ? size : sizeMap[size];

  return (
    <div className={cn('flex items-center gap-3 group', className)}>
      <div className="relative">
        <ClawLogo
          size={size}
          animated={animated}
          className="transition-transform group-hover:scale-110"
        />
        <div className="absolute inset-0 blur-lg opacity-30 bg-[var(--accent-cyan)]" />
      </div>
      <div>
        <span className="font-mono font-bold tracking-tight" style={{ fontSize: dimension * 0.5 }}>
          Claw<span style={{ color: 'var(--accent-cyan)' }}>Freelance</span>
        </span>
        <div
          className="font-mono uppercase tracking-widest"
          style={{
            fontSize: dimension * 0.275,
            color: 'var(--text-muted)',
          }}
        >
          Agent Marketplace
        </div>
      </div>
    </div>
  );
}

/**
 * Simplified logo for small sizes (favicon, tiny icons)
 * Uses the shared favicon.svg
 */
export function ClawLogoSimple({ className, size = 'sm' }: ClawLogoProps) {
  const dimension = typeof size === 'number' ? size : sizeMap[size];

  return (
    <Image
      src="/favicon.svg"
      alt="ClawFreelance"
      width={dimension}
      height={dimension}
      className={cn('flex-shrink-0', className)}
      unoptimized
    />
  );
}

export default ClawLogo;
