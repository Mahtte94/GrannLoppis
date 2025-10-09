export const theme = {
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFE66D',
    text: '#2C3E50',
    textLight: '#7F8C8D',
    background: '#F7F9FC',
    white: '#FFFFFF',
    error: '#E74C3C',
    success: '#2ECC71',
    border: '#E0E0E0'
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