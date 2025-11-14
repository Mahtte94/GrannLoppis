import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../styles/theme';
import { eventsService } from '../../services/firebase/events.service';
import { participantsService } from '../../services/firebase/participants.service';
import { SellerStackParamList } from '../../types/navigation.types';
import { Event } from '../../types';
import { useAuth } from '../../context/AuthContext';

type JoinEventScreenNavigationProp = StackNavigationProp<SellerStackParamList, 'JoinEvent'>;

export default function JoinEventScreen() {
  const navigation = useNavigation<JoinEventScreenNavigationProp>();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    // Filter events based on search query
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = events.filter(
        (event) =>
          event.name.toLowerCase().includes(query) ||
          event.area.toLowerCase().includes(query)
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await eventsService.getAllEvents();
      // Filter to only show upcoming and active events
      const availableEvents = allEvents.filter(
        (event) => event.status === 'upcoming' || event.status === 'active'
      );
      setEvents(availableEvents);
      setFilteredEvents(availableEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Fel', 'Kunde inte ladda evenemang. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToEvent = async () => {
    if (!user) {
      Alert.alert('Fel', 'Du måste vara inloggad');
      return;
    }

    if (!user.sellerProfile) {
      Alert.alert(
        'Profil saknas',
        'Du måste ha en komplett säljarprofil med adress för att kunna ansöka till evenemang.'
      );
      return;
    }

    if (!selectedEvent) {
      Alert.alert('Välj evenemang', 'Vänligen välj ett evenemang att ansöka till.');
      return;
    }

    setSubmitting(true);
    try {
      await participantsService.applyToEvent(
        selectedEvent.id,
        user.id,
        description.trim()
      );

      Alert.alert(
        'Ansökan skickad!',
        'Din ansökan har skickats till arrangören. Du kommer att få besked när din ansökan har granskats.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Error applying to event:', err);
      Alert.alert('Fel', err.message || 'Kunde inte skicka ansökan. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const isSelected = selectedEvent?.id === item.id;
    const startDate = new Date(item.startDate).toLocaleDateString('sv-SE');
    const endDate = new Date(item.endDate).toLocaleDateString('sv-SE');

    return (
      <TouchableOpacity
        style={[styles.eventCard, isSelected && styles.selectedEventCard]}
        onPress={() => setSelectedEvent(item)}
      >
        <View style={styles.eventCardHeader}>
          <Text style={styles.eventName}>{item.name}</Text>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>Vald</Text>
            </View>
          )}
        </View>
        <Text style={styles.eventArea}>{item.area}</Text>
        <Text style={styles.eventDate}>
          {startDate === endDate ? startDate : `${startDate} - ${endDate}`}
        </Text>
        <Text style={styles.eventParticipants}>
          {item.participants} {item.participants === 1 ? 'säljare' : 'säljare'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading message="Laddar evenemang..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ansök till evenemang</Text>
        <Text style={styles.subtitle}>
          Välj ett evenemang du vill ansöka till
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Sök evenemang eller område..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEventCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Inga evenemang hittades</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Försök med en annan sökning'
                : 'Det finns inga tillgängliga evenemang just nu'}
            </Text>
          </View>
        }
      />

      {selectedEvent && (
        <View style={styles.applicationForm}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formContent}
          >
            <Text style={styles.formTitle}>Ansökan till {selectedEvent.name}</Text>

            <Input
              label="Meddelande till arrangören (valfritt)"
              placeholder="Berätta lite om dig och dina föremål..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={styles.descriptionInput}
            />

            {user?.sellerProfile && (
              <View style={styles.profileBox}>
                <Text style={styles.profileLabel}>Din information som skickas:</Text>
                <Text style={styles.profileText}>
                  Namn: {user.displayName}{'\n'}
                  Adress: {user.sellerProfile.address}
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title="Skicka ansökan"
                onPress={handleApplyToEvent}
                loading={submitting}
                disabled={submitting}
                style={styles.submitButton}
              />
              <Button
                title="Avbryt"
                onPress={() => setSelectedEvent(null)}
                variant="outline"
                disabled={submitting}
              />
            </View>
          </ScrollView>
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
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  searchContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  eventCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  selectedEventCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.accent,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  eventName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  selectedBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  selectedBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  eventArea: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  eventDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  eventParticipants: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
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
  },
  applicationForm: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  formContent: {
    padding: theme.spacing.xl,
  },
  formTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  profileBox: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  profileLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  profileText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
  },
  submitButton: {
    marginBottom: theme.spacing.md,
  },
});
