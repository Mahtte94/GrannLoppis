import { UserRole, EventStatus } from '../types';

export const ROLES = UserRole;

export const EVENT_STATUS = EventStatus;

export const COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  background: '#F7F9FC',
  white: '#FFFFFF',
  error: '#E74C3C',
  success: '#2ECC71'
} as const;

export type ColorScheme = typeof COLORS;