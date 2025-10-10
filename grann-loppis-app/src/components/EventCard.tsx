import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Event, EventStatus } from '../types';
import { Card } from './common/Card';
import { theme } from '../styles/theme';

interface EventCardProps {
  event: Event;
  onPress?: (event: Event) => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case EventStatus.UPCOMING:
        return theme.colors.secondary;
      case EventStatus.ACTIVE:
        return theme.colors.success;
      case EventStatus.COMPLETED:
        return theme.colors.textLight;
      default:
        return theme.colors.textLight;
    }
  };

  const CardContent = (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>{event.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
          <Text style={styles.statusText}>{event.status}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Date:</Text>
        <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Area:</Text>
        <Text style={styles.infoValue}>{event.area}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Code:</Text>
        <Text style={styles.eventCode}>{event.eventCode}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.participantCount}>
          {event.participants} {event.participants === 1 ? 'participant' : 'participants'}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(event)} activeOpacity={0.7} style={styles.container}>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    width: 60,
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    flex: 1,
  },
  eventCode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  participantCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
});
