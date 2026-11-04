/**
 * ReadOra Design System - Spacing, Radii, Margins, and Shadows
 */

import { Platform, ViewStyle } from 'react-native';

export const Spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
} as const;

export const Layout = {
  screenHorizontal: 20,
  cardPadding: 16,
  cardGap: 14,
  bottomBarHeight: Platform.OS === 'android' ? 68 : 64,
  headerHeight: 56,
  maxContentWidth: 720,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  full: 9999,
} as const;

export const ButtonSize = {
  sm: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
  },
  md: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.lg,
  },
  lg: {
    height: 56,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.xl,
  },
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,

  goldGlow: {
    shadowColor: '#E5BA58',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  } as ViewStyle,
} as const;
