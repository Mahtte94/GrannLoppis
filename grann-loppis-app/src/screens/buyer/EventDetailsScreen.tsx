import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList, Event, EventStatus } from '../../types';
import { theme } from '../../styles/theme';
import { eventsService } from '../../services/firebase';

type EventDetailsScreenRouteProp = RouteProp<BuyerStackParamList, 'EventDetails'>;
type EventDetailsScreenNavigationProp = StackNavigationProp<BuyerStackParamList, 'EventDetails'>;

export default function EventDetailsScreen() {
  const route = useRoute<EventDetailsScreenRouteProp>();
  const navigation = useNavigation<EventDetailsScreenNavigationProp>();
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);

      // Fetch real event from Firebase
      const fetchedEvent = await eventsService.getEventById(eventId);
      console.log('Fetched event:', fetchedEvent);

      setEvent(fetchedEvent);
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Fel', 'Kunde inte ladda evenemang. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case EventStatus.ACTIVE:
        return theme.colors.success;
      case EventStatus.UPCOMING:
        return theme.colors.secondary;
      case EventStatus.COMPLETED:
        return theme.colors.textLight;
      default:
        return theme.colors.textLight;
    }
  };

  const getStatusText = (status: EventStatus) => {
    switch (status) {
      case EventStatus.ACTIVE:
        return 'Active Now';
      case EventStatus.UPCOMING:
        return 'Upcoming';
      case EventStatus.COMPLETED:
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar evenemang...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Evenemang hittades inte</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
            <Text style={styles.statusText}>{getStatusText(event.status)}</Text>
          </View>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.location}>{event.area}</Text>
          <Text style={styles.date}>{formatDate(event.date)}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Event Code</Text>
            <Text style={styles.infoValue}>{event.eventCode}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Sellers</Text>
            <Text style={styles.infoValue}>{event.participants}</Text>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>About This Event</Text>
          <Text style={styles.description}>
            Join us for a great day of garage sale shopping! Browse items from {event.participants} sellers in {event.area}.
            {'\n\n'}
            Find vintage clothing, furniture, books, electronics, and more at amazing prices.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => navigation.navigate('EventMap', { eventId: event.id })}
        >
          <Text style={styles.mapButtonText}>View Sellers on Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.error,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  location: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  date: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  infoSection: {
    flexDirection: 'row',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  descriptionSection: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 24,
  },
  footer: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  mapButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  mapButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
