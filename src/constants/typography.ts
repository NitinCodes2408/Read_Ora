/**
 * ReadOra Design System - Typography Tokens
 * Designed for readability, elegance, and long reading sessions.
 */

import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const FontSize = {
  xxs: 11,
  xs: 12,
  sm: 13,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
  display: 34,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

export const Typography: Record<string, TextStyle> = {
  display: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    lineHeight: 40,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  title1: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    lineHeight: 34,
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  title2: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semiBold,
    lineHeight: 30,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  title3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    lineHeight: 26,
    color: Colors.text.primary,
  },
  headline: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    lineHeight: 24,
    color: Colors.text.primary,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: 23,
    color: Colors.text.primary,
  },
  bodySecondary: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: 23,
    color: Colors.text.secondary,
  },
  subhead: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
    color: Colors.text.secondary,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: 18,
    color: Colors.text.tertiary,
  },
  captionBold: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  tagline: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    lineHeight: 22,
    color: Colors.gold.primary,
    letterSpacing: 0.5,
  },
};
