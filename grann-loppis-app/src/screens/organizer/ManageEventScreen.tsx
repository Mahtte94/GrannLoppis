import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OrganizerStackParamList, Event, EventStatus } from '../../types';
import { EventCard } from '../../components/EventCard';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../styles/theme';

type ManageEventScreenNavigationProp = StackNavigationProp<OrganizerStackParamList, 'ManageEvent'>;

export default function ManageEventScreen() {
  const navigation = useNavigation<ManageEventScreenNavigationProp>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);

      // Mock events data - in production, fetch user's events from Firebase
      const mockEvents: Event[] = [
        {
          id: 'event-1',
          name: 'Södermalm Spring Market',
          date: new Date('2025-05-15'),
          area: 'Södermalm, Stockholm',
          eventCode: 'SPRING2025',
          organizerId: 'current-user-id',
          createdAt: new Date(),
          status: EventStatus.UPCOMING,
          participants: 12,
        },
        {
          id: 'event-2',
          name: 'Vasastan Garage Sale',
          date: new Date('2025-05-20'),
          area: 'Vasastan, Stockholm',
          eventCode: 'VASA2025',
          organizerId: 'current-user-id',
          createdAt: new Date(),
          status: EventStatus.ACTIVE,
          participants: 8,
        },
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate('ParticipantsList', { eventId: event.id });
  };

  const handleCreateEvent = () => {
    navigation.navigate('CreateEvent');
  };

  if (loading) {
    return <Loading message="Loading your events..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mina evenemang</Text>
        <Text style={styles.subtitle}>
          {events.length} {events.length === 1 ? 'evenemang' : 'evenemang'}
        </Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={handleEventPress} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Inga evenemang än</Text>
            <Text style={styles.emptyText}>
              Skapa ditt första loppis-evenemang och börja bjuda in säljare!
            </Text>
            <Button
              title="Skapa ditt första evenemang"
              onPress={handleCreateEvent}
              style={styles.emptyButton}
            />
          </View>
        }
      />

      {events.length > 0 && (
        <View style={styles.footer}>
          <Button
            title="Skapa nytt evenemang"
            onPress={handleCreateEvent}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    minWidth: 250,
  },
  footer: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
