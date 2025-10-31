import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'low' | 'medium' | 'high';
}

export function Card({ children, style, elevation = 'medium' }: CardProps) {
  const elevationStyle = elevation === 'low'
    ? styles.elevationLow
    : elevation === 'high'
    ? styles.elevationHigh
    : styles.elevationMedium;

  return (
    <View style={[styles.card, elevationStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  elevationLow: {
    boxShadow: '-2px 4px 4px 0px rgba(0, 0, 0, 0.2), inset -1px 1px 2px -2px rgba(255, 255, 255, 1)',
  },
  elevationMedium: {
    boxShadow: '-4px 8px 8px 0px rgba(0, 0, 0, 0.3), inset -2px 2px 4px -4px rgba(255, 255, 255, 1)',
  },
  elevationHigh: {
    boxShadow: '-6px 12px 12px 0px rgba(0, 0, 0, 0.4), inset -3px 3px 6px -6px rgba(255, 255, 255, 1)',
  },
});
