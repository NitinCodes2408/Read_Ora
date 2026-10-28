/**
 * ReadOra Design System - Colors
 * 
 * Brand Identity:
 * - Primary background: Deep Midnight Navy
 * - Primary accent: Elegant Gold
 * - Light reading surfaces: Warm Ivory
 * - Dark & Light text contrasts
 */

export const Colors = {
  // Brand Base Palette
  midnight: {
    darkest: '#080A0F',     // Deepest background (Android nav bar / root)
    background: '#0B0E14',  // Primary app background (showcase dark navy)
    surface: '#131822',     // Elevated card background
    surfaceElevated: '#1A2130', // Floating dialog / elevated surface
    surfaceHighlight: '#222B3D',// Active / pressed / hover surface
    border: '#1F2737',      // Subtle card & divider border
    borderSubtle: '#171E2B',// Ultra-soft separator
  },

  // ReadOra Signature Gold Accent Palette
  gold: {
    primary: '#E5BA58',     // Main brand gold (showcase primary button / active accent)
    light: '#F3CF7A',       // Highlight gold
    glow: 'rgba(229, 186, 88, 0.14)', // Subtle ambient halo
    border: 'rgba(229, 186, 88, 0.28)', // Subtle gold border
    deep: '#C59A3D',        // Pressed / darker gold
    muted: '#967838',       // Subtle gold label
    dark: '#54421C',        // Deep gold background tint
  },

  // Warm Ivory (Reading Surface Palette)
  ivory: {
    background: '#FAF6EE',  // Warm book page background
    surface: '#F4EFE3',     // Ivory card surface
    border: '#E8E0D0',      // Ivory divider
    text: '#1C1917',        // Rich ink dark text
    textMuted: '#57534E',   // Muted reading text
  },

  // Text & Typography Contrast
  text: {
    primary: '#F8FAFC',     // High-contrast clean white/silver
    secondary: '#94A3B8',   // Balanced readable muted silver
    tertiary: '#64748B',    // Subdued captions & footnotes
    disabled: '#475569',    // Disabled controls
    inverse: '#0B0E14',     // Dark text on gold/light buttons
    gold: '#E5BA58',        // Accent text
  },

  // Functional & Semantic States
  status: {
    success: '#34D399',
    successBg: 'rgba(52, 211, 153, 0.12)',
    warning: '#FBBF24',
    warningBg: 'rgba(251, 191, 36, 0.12)',
    error: '#F87171',
    errorBg: 'rgba(248, 113, 113, 0.12)',
    info: '#60A5FA',
    infoBg: 'rgba(96, 165, 250, 0.12)',
  },

  // Overlays
  overlay: {
    dark: 'rgba(5, 7, 11, 0.75)',
    goldGlow: 'rgba(229, 186, 88, 0.08)',
  },
} as const;

export type ColorTokens = typeof Colors;
