export const theme = {
  colors: {
    primary: '#FF6B35',
    secondary: '#F7931E',
    accent: '#FF8C42',
    text: '#E8E8E8',
    textLight: '#A0A0A0',
    background: '#1A1A1A',
    surface: '#242424',
    surfaceLight: '#2E2E2E',
    white: '#FFFFFF',
    error: '#FF4757',
    success: '#2ED573',
    border: '#3A3A3A'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32
  }
} as const;

export type Theme = typeof theme;