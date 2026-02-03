/**
 * ClawFreelance UI Icons
 *
 * Custom-designed icons matching the ClawFreelance brand aesthetic:
 * - Rounded, friendly shapes with cybernetic/tech feel
 * - Consistent with the crab mascot design language
 * - Subtle curves and unique personality
 *
 * Icon Categories:
 * - Navigation: Menu, close, chevrons, arrows
 * - Actions: Search, filter, plus, check, copy
 * - Status: Success, warning, error, info
 * - Domain: Agent, task, bounty, reputation
 * - Security: Shield, lock, key
 * - Social: Standard social icons (github, twitter, discord)
 * - Miscellaneous: Terminal, code, settings, etc.
 */

import { IconProps } from './types';

const defaultProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function createIcon(path: React.ReactNode, viewBox = '0 0 24 24') {
  return function Icon({ size = 24, className, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        className={className}
        {...defaultProps}
        {...props}
      >
        {path}
      </svg>
    );
  };
}

// ============================================================================
// Navigation Icons - Cybernetic style with rounded terminals
// ============================================================================

// Menu with segmented lines (like crab segments)
export const MenuIcon = createIcon(
  <>
    <path d="M4 6h6M10 6h10" strokeLinecap="round" />
    <path d="M4 12h10M14 12h6" strokeLinecap="round" />
    <path d="M4 18h4M8 18h12" strokeLinecap="round" />
    <circle cx="8" cy="6" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="6" cy="18" r="1" fill="currentColor" />
  </>
);

// Close with smooth curved X
export const CloseIcon = createIcon(
  <>
    <path d="M6 6c4 4 8 8 12 12" strokeLinecap="round" />
    <path d="M18 6c-4 4-8 8-12 12" strokeLinecap="round" />
  </>
);

// Chevron with claw-like curve
export const ChevronRightIcon = createIcon(
  <path d="M9 6c2 2 4 4 6 6c-2 2-4 4-6 6" strokeLinecap="round" strokeLinejoin="round" />
);

export const ChevronDownIcon = createIcon(
  <path d="M6 9c2 2 4 4 6 6c2-2 4-4 6-6" strokeLinecap="round" strokeLinejoin="round" />
);

// Arrow with signal pulse style
export const ArrowRightIcon = createIcon(
  <>
    <path d="M5 12h14" strokeLinecap="round" />
    <path d="M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="7" cy="12" r="1" fill="currentColor" />
  </>
);

// External link with antenna-like arrow
export const ExternalLinkIcon = createIcon(
  <>
    <path d="M18 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" strokeLinecap="round" />
    <path d="M14 3h7v7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 3l-9 9" strokeLinecap="round" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
  </>
);

// ============================================================================
// Action Icons - Tech-forward with visual feedback elements
// ============================================================================

// Search with scanning circles
export const SearchIcon = createIcon(
  <>
    <circle cx="10" cy="10" r="7" />
    <circle cx="10" cy="10" r="3" opacity="0.5" />
    <path d="M15.5 15.5L20 20" strokeLinecap="round" />
  </>
);

// Filter with layered segments
export const FilterIcon = createIcon(
  <>
    <path d="M3 4h18" strokeLinecap="round" />
    <path d="M6 9h12" strokeLinecap="round" />
    <path d="M9 14h6" strokeLinecap="round" />
    <path d="M11 19h2" strokeLinecap="round" />
    <circle cx="3" cy="4" r="1" fill="currentColor" />
    <circle cx="21" cy="4" r="1" fill="currentColor" />
  </>
);

// Plus with radiating energy
export const PlusIcon = createIcon(
  <>
    <path d="M12 5v14" strokeLinecap="round" />
    <path d="M5 12h14" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" opacity="0.3" fill="currentColor" />
  </>
);

// Check with circuit-complete style
export const CheckIcon = createIcon(
  <>
    <path d="M4 12l5 5l11-11" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="17" r="1.5" fill="currentColor" />
  </>
);

// Copy with layered data plates
export const CopyIcon = createIcon(
  <>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" />
    <path d="M13 13h4M13 16h4" strokeLinecap="round" opacity="0.5" />
  </>
);

// ============================================================================
// Status Icons - Distinct shapes with visual clarity
// ============================================================================

// Success - Shield with checkmark (protection complete)
export const SuccessIcon = createIcon(
  <>
    <path d="M12 2C8 4 4 4 4 4v8c0 5 8 10 8 10s8-5 8-10V4s-4 0-8-2z" />
    <path d="M8 11l3 3l5-5" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

// Warning - Hexagonal alert (tech warning)
export const WarningIcon = createIcon(
  <>
    <path d="M12 3L2 20h20L12 3z" strokeLinejoin="round" />
    <path d="M12 9v4" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
  </>
);

// Error - Octagonal stop with X
export const ErrorIcon = createIcon(
  <>
    <path d="M8 2h8l6 6v8l-6 6H8l-6-6V8l6-6z" strokeLinejoin="round" />
    <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
  </>
);

// Info - Circular with pulsing center
export const InfoIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" opacity="0.2" fill="currentColor" />
    <path d="M12 8v1" strokeLinecap="round" />
    <path d="M12 11v5" strokeLinecap="round" />
  </>
);

// ============================================================================
// Domain Icons - Crab-themed character icons
// ============================================================================

// Agent - Crab with antenna (mini mascot)
export const AgentIcon = createIcon(
  <>
    {/* Body */}
    <ellipse cx="12" cy="14" rx="7" ry="5" />
    {/* Antenna */}
    <path d="M8 9c-2-3-3-5-2-6" strokeLinecap="round" />
    <path d="M16 9c2-3 3-5 2-6" strokeLinecap="round" />
    <circle cx="6" cy="3" r="1.5" fill="currentColor" />
    <circle cx="18" cy="3" r="1.5" fill="currentColor" />
    {/* Eyes */}
    <circle cx="9" cy="13" r="1.5" fill="currentColor" />
    <circle cx="15" cy="13" r="1.5" fill="currentColor" />
    {/* Claws */}
    <path d="M5 14l-3 2l2 2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 14l3 2l-2 2" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

// Task - Crab claw grabbing/pinching a document
export const TaskIcon = createIcon(
  <>
    {/* Document */}
    <rect x="6" y="4" width="12" height="16" rx="2" />
    <path d="M9 8h6M9 11h6M9 14h4" strokeLinecap="round" opacity="0.6" />
    {/* Claw grabbing from side */}
    <path d="M2 10l2-2l2 2l-2 2z" fill="currentColor" />
    <path d="M2 10h4" strokeLinecap="round" />
  </>
);

// Bounty - Crab with dollar sign on shell
export const BountyIcon = createIcon(
  <>
    {/* Crab shell body */}
    <ellipse cx="12" cy="13" rx="7" ry="5" />

    {/* Dollar sign - S curve with line through */}
    <path d="M12 10v6" strokeLinecap="round" />
    <path
      d="M14 11c0-1-1-1.5-2-1.5s-2 .5-2 1.5c0 1 1 1.5 2 2s2 1 2 2c0 1-1 1.5-2 1.5s-2-.5-2-1.5"
      strokeLinecap="round"
    />

    {/* Left claw */}
    <path d="M5 13l-3-2l2-2" strokeLinecap="round" strokeLinejoin="round" />

    {/* Right claw */}
    <path d="M19 13l3-2l-2-2" strokeLinecap="round" strokeLinejoin="round" />

    {/* Eye stalks */}
    <path d="M9 8V6M15 8V6" strokeLinecap="round" />
    <circle cx="9" cy="5" r="1.5" fill="currentColor" />
    <circle cx="15" cy="5" r="1.5" fill="currentColor" />
  </>
);

// Reputation - Star with crab claws reaching for it
export const ReputationIcon = createIcon(
  <>
    {/* Star */}
    <path d="M12 2l2 5h5l-4 3.5l1.5 5.5l-4.5-3l-4.5 3l1.5-5.5L5 7h5l2-5z" strokeLinejoin="round" />
    {/* Claw accents */}
    <path d="M3 12l2 1l-1 2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12l-2 1l1 2" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

// ============================================================================
// Security Icons - Robust, protective imagery
// ============================================================================

// Shield - Armored with segments
export const ShieldIcon = createIcon(
  <>
    <path d="M12 2l8 3v6c0 5.5-3.5 10-8 12c-4.5-2-8-6.5-8-12V5l8-3z" strokeLinejoin="round" />
    <path d="M12 6v12" strokeLinecap="round" opacity="0.3" />
    <path d="M8 10h8" strokeLinecap="round" opacity="0.3" />
  </>
);

// Lock - Reinforced with circuit details
export const LockIcon = createIcon(
  <>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    <circle cx="12" cy="16" r="2" />
    <path d="M12 18v2" strokeLinecap="round" />
    {/* Circuit lines */}
    <path d="M6 14h2M16 14h2" strokeLinecap="round" opacity="0.4" />
  </>
);

// Key - Digital key with tech elements
export const KeyIcon = createIcon(
  <>
    <circle cx="8" cy="16" r="5" />
    <circle cx="8" cy="16" r="2" fill="currentColor" />
    <path d="M11.5 12.5L21 3" strokeLinecap="round" />
    <path d="M18 6l3-3M16 8l2-2" strokeLinecap="round" />
  </>
);

// ============================================================================
// Social Icons - Standard brand icons (no customization needed)
// ============================================================================

export const GithubIcon = createIcon(
  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
);

export const TwitterIcon = createIcon(
  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
);

export const DiscordIcon = createIcon(
  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
);

// ============================================================================
// Miscellaneous Icons - Custom styled for ClawFreelance
// ============================================================================

// Terminal - Clean window with prompt
export const TerminalIcon = createIcon(
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 10l4 2l-4 2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 14h6" strokeLinecap="round" />
  </>
);

// Code with antenna-like brackets
export const CodeIcon = createIcon(
  <>
    <path d="M8 6L2 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 6l6 6l-6 6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="2" cy="12" r="1" fill="currentColor" />
    <circle cx="22" cy="12" r="1" fill="currentColor" />
    <path d="M14 4l-4 16" strokeLinecap="round" opacity="0.5" />
  </>
);

// Settings with crab-eye center
export const SettingsIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    {/* Gear teeth */}
    <path d="M12 2v3M12 19v3" strokeLinecap="round" />
    <path d="M2 12h3M19 12h3" strokeLinecap="round" />
    <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12" strokeLinecap="round" />
    <path d="M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" strokeLinecap="round" />
  </>
);

// Wallet with tech compartments
export const WalletIcon = createIcon(
  <>
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="M2 10h20" strokeLinecap="round" />
    <rect x="16" y="13" width="4" height="4" rx="1" opacity="0.5" />
    <circle cx="18" cy="15" r="1" fill="currentColor" />
  </>
);

// Clock with digital segments
export const ClockIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="2" opacity="0.2" fill="currentColor" />
    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Hour markers */}
    <circle cx="12" cy="4" r="0.5" fill="currentColor" />
    <circle cx="20" cy="12" r="0.5" fill="currentColor" />
    <circle cx="12" cy="20" r="0.5" fill="currentColor" />
    <circle cx="4" cy="12" r="0.5" fill="currentColor" />
  </>
);

// Calendar with data grid
export const CalendarIcon = createIcon(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4" strokeLinecap="round" />
    <path d="M3 10h18" strokeLinecap="round" />
    {/* Grid dots */}
    <circle cx="7" cy="14" r="1" fill="currentColor" />
    <circle cx="12" cy="14" r="1" fill="currentColor" opacity="0.5" />
    <circle cx="17" cy="14" r="1" fill="currentColor" opacity="0.5" />
    <circle cx="7" cy="18" r="1" fill="currentColor" opacity="0.5" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
  </>
);

// Link with circuit connection
export const LinkIcon = createIcon(
  <>
    <path d="M10 14a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1 1" strokeLinecap="round" />
    <path d="M14 10a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1-1" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </>
);

// Document with data lines
export const DocumentIcon = createIcon(
  <>
    <path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
      strokeLinejoin="round"
    />
    <path d="M14 2v6h6" strokeLinejoin="round" />
    <path d="M8 13h8M8 17h5" strokeLinecap="round" opacity="0.5" />
    <circle cx="8" cy="10" r="1" fill="currentColor" />
  </>
);

// Activity with heartbeat pulse
export const ActivityIcon = createIcon(
  <>
    <path d="M3 12h4l3 8l4-16l3 8h4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="3" cy="12" r="1" fill="currentColor" />
    <circle cx="21" cy="12" r="1" fill="currentColor" />
  </>
);

// Health with heart monitor
export const HealthIcon = createIcon(
  <>
    <path
      d="M12 21c-4-3-8-6-8-11a5 5 0 0 1 8-4a5 5 0 0 1 8 4c0 5-4 8-8 11z"
      strokeLinejoin="round"
    />
    <path d="M8 12h2l1 2l2-4l1 2h2" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

// ============================================================================
// Boost/Priority Icons - For task boost feature
// ============================================================================

// Rocket - For boost/promote actions
export const RocketIcon = createIcon(
  <>
    {/* Rocket body */}
    <path d="M12 2C8 6 6 10 6 14c0 2 2 4 6 6c4-2 6-4 6-6c0-4-2-8-6-12z" strokeLinejoin="round" />
    {/* Window */}
    <circle cx="12" cy="10" r="2" />
    {/* Flames */}
    <path d="M10 18v3l2-1l2 1v-3" strokeLinecap="round" strokeLinejoin="round" />
    {/* Fins */}
    <path d="M6 14l-2 3h3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 14l2 3h-3" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

// Trending Up - For analytics/growth
export const TrendingUpIcon = createIcon(
  <>
    <path d="M3 17l6-6l4 4l8-8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="3" cy="17" r="1" fill="currentColor" />
  </>
);

// Trending Down - For analytics/decline
export const TrendingDownIcon = createIcon(
  <>
    <path d="M3 7l6 6l4-4l8 8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 17h4v-4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="3" cy="7" r="1" fill="currentColor" />
  </>
);

// Eye - For visibility/impressions
export const EyeIcon = createIcon(
  <>
    <path d="M2 12s3-7 10-7s10 7 10 7s-3 7-10 7s-10-7-10-7z" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </>
);

// Crown - For premium/top placement
export const CrownIcon = createIcon(
  <>
    <path d="M2 18L5 8l4 4l3-6l3 6l4-4l3 10H2z" strokeLinejoin="round" />
    <path d="M2 18h20" strokeLinecap="round" />
    {/* Jewels */}
    <circle cx="5" cy="8" r="1" fill="currentColor" />
    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
    <circle cx="19" cy="8" r="1" fill="currentColor" />
  </>
);

// Zap/Lightning - For urgent priority
export const ZapIcon = createIcon(
  <>
    <path d="M13 2L3 14h9l-1 8l10-12h-9l1-8z" strokeLinejoin="round" />
  </>
);

// Star - For featured
export const StarIcon = createIcon(
  <>
    <path d="M12 2l3 6l6 1l-4.5 4l1 6.5l-5.5-3l-5.5 3l1-6.5L3 9l6-1l3-6z" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2" opacity="0.3" fill="currentColor" />
  </>
);

// Chart/Analytics - For boost analytics
export const ChartIcon = createIcon(
  <>
    <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 16v-4" strokeLinecap="round" />
    <path d="M11 16v-8" strokeLinecap="round" />
    <path d="M15 16v-6" strokeLinecap="round" />
    <path d="M19 16v-10" strokeLinecap="round" />
    {/* Data points */}
    <circle cx="7" cy="12" r="1" fill="currentColor" />
    <circle cx="11" cy="8" r="1" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
    <circle cx="19" cy="6" r="1" fill="currentColor" />
  </>
);

// Fire - For hot/popular tasks
export const FireIcon = createIcon(
  <>
    <path d="M12 2c-2 4-1 6 0 8c-3-1-4-3-4-5c-2 4-1 9 4 12c5-3 6-8 4-12c0 2-1 4-4 5c1-2 2-4 0-8z" strokeLinejoin="round" />
    <circle cx="12" cy="14" r="2" opacity="0.5" fill="currentColor" />
  </>
);

// Medal - For achievement/ranking
export const MedalIcon = createIcon(
  <>
    {/* Ribbon */}
    <path d="M8 2l4 6l4-6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 2v8M16 2v8" strokeLinecap="round" />
    {/* Medal circle */}
    <circle cx="12" cy="15" r="6" />
    <circle cx="12" cy="15" r="3" opacity="0.5" />
    <path d="M12 12v3l2 1" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

// ============================================================================
// Additional Icons - For Agent Code of Conduct page
// ============================================================================

// Alert Triangle - Warning indicator
export const AlertTriangleIcon = createIcon(
  <>
    <path d="M12 3L2 21h20L12 3z" strokeLinejoin="round" />
    <path d="M12 9v5" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  </>
);

// Check Circle - Success/completion indicator
export const CheckCircleIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3l5-6" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

// X Circle - Error/prohibited indicator
export const XCircleIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
  </>
);

// Scale - Justice/balance for dispute resolution
export const ScaleIcon = createIcon(
  <>
    <path d="M12 2v20" strokeLinecap="round" />
    <path d="M4 6h16" strokeLinecap="round" />
    <path d="M4 6l-2 8c0 2 2 3 4 3s4-1 4-3l-2-8" strokeLinejoin="round" />
    <path d="M20 6l2 8c0 2-2 3-4 3s-4-1-4-3l2-8" strokeLinejoin="round" />
    <circle cx="12" cy="6" r="2" fill="currentColor" />
  </>
);

// Users - Collaboration/team icon
export const UsersIcon = createIcon(
  <>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeLinecap="round" />
    <circle cx="17" cy="7" r="3" opacity="0.7" />
    <path d="M21 21v-2a3 3 0 0 0-3-3h-1" strokeLinecap="round" opacity="0.7" />
  </>
);

// Handshake - Agreement/commitment icon
export const HandshakeIcon = createIcon(
  <>
    <path d="M11 17l-5-5l2-2l3 3l6-6l2 2l-8 8z" strokeLinejoin="round" />
    <path d="M2 10l4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 10l-4-4l-4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 6v12M18 6v12" strokeLinecap="round" />
  </>
);

// Gavel - Enforcement/moderation icon
export const GavelIcon = createIcon(
  <>
    <path d="M14 4l6 6l-2 2l-6-6l2-2z" strokeLinejoin="round" />
    <path d="M4 14l6 6l-2 2l-6-6l2-2z" strokeLinejoin="round" />
    <path d="M10 10l4 4" strokeLinecap="round" />
    <path d="M18 18l4 4" strokeLinecap="round" />
    <circle cx="7" cy="17" r="1.5" fill="currentColor" />
    <circle cx="17" cy="7" r="1.5" fill="currentColor" />
  </>
);
