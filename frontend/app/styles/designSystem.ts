// HayvanPazarı Design System
// Based on Google Stitch designs

export const Colors = {
  // Primary Brand Colors
  primary: '#0561d1',
  primaryHover: '#0451b8',
  primaryLight: '#3b82f6',
  
  // Background Colors
  backgroundLight: '#f5f7f8',
  backgroundDark: '#0f1823',
  backgroundWhite: '#ffffff',
  backgroundCard: '#ffffff',
  
  // Input & Surface Colors
  inputLight: '#e5e7eb',
  inputDark: '#1f2937',
  surfaceLight: '#f9fafb',
  surfaceDark: '#111827',
  
  // Text Colors
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textDark: '#f9fafb',
  textWhite: '#ffffff',
  textMuted: '#6b7280',
  textMutedDark: '#9ca3af',
  
  // Border & Divider Colors
  borderLight: '#d1d5db',
  borderDark: '#374151',
  borderTransparent: 'transparent',
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Subtle Colors
  subtleLight: '#6b7280',
  subtleDark: '#9ca3af',
};

export const Typography = {
  // Plus Jakarta Sans - primary font from Google Stitch design
  fontFamily: {
    primary: 'System', // React Native will use system font as fallback
    display: 'System',
  },
  
  // Font Sizes (aligned with design system)
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font Weights (Plus Jakarta Sans weights)
  weights: {
    normal: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
    extrabold: '800' as '800',
  },
  
  // Line Heights
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },
};

export const Spacing = {
  // Base spacing unit: 4px
  xs: 4,
  sm: 8,
  base: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 999,
};

export const Shadows = {
  // Card shadows
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Button shadows
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Modal shadows
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
};

// Component Specific Styles
export const ComponentStyles = {
  // Button Styles
  button: {
    height: 48,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
  },
  
  // Input Styles  
  input: {
    height: 48,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    fontSize: Typography.sizes.base,
  },
  
  // Card Styles
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundWhite,
    ...Shadows.card,
  },
  
  // Header Styles
  header: {
    height: 60,
    paddingHorizontal: Spacing.md,
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ComponentStyles,
};