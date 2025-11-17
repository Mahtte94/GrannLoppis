import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Participant } from '../types';
import { Card } from './common/Card';
import { theme } from '../styles/theme';

interface ParticipantCardProps {
  participant: Participant;
  onPress?: (participant: Participant) => void;
  showItemCount?: boolean;
  itemCount?: number;
}

export function ParticipantCard({
  participant,
  onPress,
  showItemCount = false,
  itemCount = 0
}: ParticipantCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const CardContent = (
    <View>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {participant.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{participant.displayName}</Text>
          {participant.joinedAt && (
            <Text style={styles.joinedDate}>
              Joined {formatDate(participant.joinedAt)}
            </Text>
          )}
        </View>
      </View>

      {participant.description && (
        <Text style={styles.description} numberOfLines={2}>
          {participant.description}
        </Text>
      )}

      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Address:</Text>
        <Text style={styles.address} numberOfLines={2}>
          {participant.address}
        </Text>
      </View>

      {showItemCount && (
        <View style={styles.footer}>
          <Text style={styles.itemCount}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} for sale
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => onPress(participant)}
        activeOpacity={0.7}
        style={styles.container}
      >
        <Card>
          {CardContent}
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Card>
        {CardContent}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontFamily: theme.fonts.heading,
    fontSize: theme.fontSize.xl,
    color: theme.colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontFamily: theme.fonts.subheading,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  joinedDate: {
    fontFamily: theme.fonts.caption,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
  },
  description: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  addressContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  addressLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  address: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  footer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  itemCount: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
});
