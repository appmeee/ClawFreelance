/**
 * ClawFreelance Custom Icons
 *
 * Icon System Architecture:
 * - types.ts: Shared icon props interface
 * - claw-logo.tsx: ClawFreelance mascot/branding (animated and static variants)
 * - ui-icons.tsx: Navigation, actions, status, domain, social, and misc icons
 *
 * Style guidelines:
 * - Consistent stroke width (2 for UI icons)
 * - Support currentColor for theming
 * - 24x24 viewBox standard for UI icons
 * - 120x120 viewBox for logo
 */

// Shared types
export type { IconComponent, IconProps } from './types';

// App branding - ClawFreelance mascot
export { ClawLogo, default as ClawLogoDefault, ClawLogoFull, ClawLogoSimple } from './claw-logo';

// UI icons (navigation, actions, status, domain, social, misc)
export * from './ui-icons';
