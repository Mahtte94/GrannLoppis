import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OrganizerStackParamList, Event } from '../../types';
import { EventCard } from '../../components/EventCard';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { eventsService } from '../../services/firebase/events.service';

type ManageEventScreenNavigationProp = StackNavigationProp<OrganizerStackParamList, 'ManageEvent'>;

export default function ManageEventScreen() {
  const navigation = useNavigation<ManageEventScreenNavigationProp>();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Use useFocusEffect to reload events when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [user])
  );

  const loadEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch real events from Firebase
      const fetchedEvents = await eventsService.getOrganizerEvents(user.id);
      setEvents(fetchedEvents);

    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Fel', 'Kunde inte ladda dina evenemang. Försök igen.');
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

  const handleDeleteEvent = (event: Event) => {
    Alert.alert(
      'Ta bort evenemang',
      `Är du säker på att du vill ta bort "${event.name}"?\n\nDetta kommer att ta bort evenemanget och alla relaterade ansökningar. Detta går inte att ångra.`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventsService.deleteEvent(event.id);
              Alert.alert('Borttaget', 'Evenemanget har tagits bort.');
              loadEvents(); // Reload the list
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Fel', 'Kunde inte ta bort evenemanget. Försök igen.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loading message="Laddar dina evenemang..." fullScreen />;
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
          <EventCard event={item} onPress={handleEventPress} onDelete={handleDeleteEvent} />
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
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
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
    fontWeight: '700',
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
    backgroundColor: theme.colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
