export const Colors = {
  primary: '#6B66A8',
  primaryDark: '#4E4A80',
  primaryLight: '#EEEEF8',

  secondary: '#FF6584',
  accent: '#43C6AC',

  // Activity category colours
  engineering: '#FF8C42',
  health: '#43C6AC',
  science: '#6C63FF',

  background: '#F4F6FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2FA',

  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  border: '#E5E7EB',
  divider: '#F3F4F6',

  white: '#FFFFFF',
  black: '#000000',
};

export const Typography = {
  h1: { fontSize: 24, fontWeight: '800', color: Colors.text },
  h2: { fontSize: 20, fontWeight: '700', color: Colors.text },
  h3: { fontSize: 16, fontWeight: '600', color: Colors.text },
  h4: { fontSize: 14, fontWeight: '600', color: Colors.text },
  body: { fontSize: 13, fontWeight: '400', color: Colors.text },
  bodySmall: { fontSize: 11, fontWeight: '400', color: Colors.textSecondary },
  caption: { fontSize: 10, fontWeight: '400', color: Colors.textLight },
  label: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};
