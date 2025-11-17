import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { EventCard } from '../../components/EventCard';
import { theme } from '../../styles/theme';
import { eventsService } from '../../services/firebase/events.service';
import { participantsService } from '../../services/firebase/participants.service';
import { SellerStackParamList } from '../../types/navigation.types';
import { Event } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAnimatedHeader } from '../../hooks';

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
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Use animated header hook
  const { handleScroll } = useAnimatedHeader({
    startFadeAt: 20,
    endFadeAt: 100,
  });

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

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    // Initialize with no dates selected - user must choose
    setSelectedDates([]);
  };

  // Generate array of dates between event start and end
  const getEventDates = (event: Event): string[] => {
    const dates: string[] = [];
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const toggleDate = (date: string) => {
    setSelectedDates(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      } else {
        return [...prev, date].sort();
      }
    });
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

    if (selectedDates.length === 0) {
      Alert.alert('Välj datum', 'Vänligen välj minst ett datum du vill sälja.');
      return;
    }

    setSubmitting(true);
    try {
      await participantsService.applyToEvent(
        selectedEvent.id,
        user.id,
        description.trim(),
        selectedDates
      );

      // Reset form state
      setSelectedEvent(null);
      setDescription('');
      setSelectedDates([]);

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

    return (
      <View style={[styles.eventCardWrapper, isSelected && styles.selectedEventCard]}>
        <EventCard
          event={item}
          onPress={() => handleSelectEvent(item)}
        />
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓ Vald</Text>
          </View>
        )}
        {!isSelected && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleSelectEvent(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.joinButtonText}>Gå med</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return <Loading message="Laddar loppisar..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ansök till loppis</Text>
        <Text style={styles.subtitle}>
          Välj en loppis du vill ansöka till
        </Text>
      </View>

      {/* Expanded Application Form */}
      {selectedEvent ? (
        <ScrollView
          style={styles.expandedContainer}
          contentContainerStyle={styles.expandedContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.expandedForm}>
            <Text style={styles.expandedFormTitle}>Ansökan till {selectedEvent.name}</Text>

            {/* Event Details */}
            <View style={styles.eventDetails}>
              <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>Start:</Text>
                <Text style={styles.eventDetailValue}>
                  {new Date(selectedEvent.startDate).toLocaleDateString('sv-SE')}
                </Text>
              </View>
              <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>Slut:</Text>
                <Text style={styles.eventDetailValue}>
                  {new Date(selectedEvent.endDate).toLocaleDateString('sv-SE')}
                </Text>
              </View>
              <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>Plats:</Text>
                <Text style={styles.eventDetailValue}>{selectedEvent.area}</Text>
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.dateSelectionContainer}>
              <Text style={styles.dateSelectionTitle}>Välj datum du vill sälja:</Text>
              <Text style={styles.dateSelectionSubtitle}>
                Välj de dagar du vill delta i evenemanget
              </Text>
              <View style={styles.datesContainer}>
                {getEventDates(selectedEvent).map((date) => {
                  const isSelected = selectedDates.includes(date);
                  const dateObj = new Date(date + 'T12:00:00');
                  const dayName = dateObj.toLocaleDateString('sv-SE', { weekday: 'short' });
                  const dateStr = dateObj.toLocaleDateString('sv-SE', {
                    day: 'numeric',
                    month: 'short'
                  });

                  return (
                    <TouchableOpacity
                      key={date}
                      style={[
                        styles.dateChip,
                        isSelected && styles.dateChipSelected
                      ]}
                      onPress={() => toggleDate(date)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dateChipDay,
                        isSelected && styles.dateChipDaySelected
                      ]}>
                        {dayName}
                      </Text>
                      <Text style={[
                        styles.dateChipDate,
                        isSelected && styles.dateChipDateSelected
                      ]}>
                        {dateStr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.selectedDatesCount}>
                {selectedDates.length === 0
                  ? 'Inga datum valda'
                  : `${selectedDates.length} ${selectedDates.length === 1 ? 'dag' : 'dagar'} vald${selectedDates.length === 1 ? '' : 'a'}`}
              </Text>
            </View>

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
                onPress={() => {
                  setSelectedEvent(null);
                  setSelectedDates([]);
                }}
                variant="outline"
                disabled={submitting}
              />
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Seller Profile Card */}
          {user && (
            <TouchableOpacity
              style={styles.profileCard}
              onPress={() => navigation.navigate('AddAddress')}
            >
              <View style={styles.profileCardContent}>
                <View style={styles.profileCardLeft}>
                  <Text style={styles.profileCardTitle}>Din säljarprofil</Text>
                  {user.sellerProfile ? (
                    <>
                      <Text style={styles.profileCardAddress}>
                        {user.sellerProfile.address}
                      </Text>
                      {user.sellerProfile.phoneNumber && (
                        <Text style={styles.profileCardPhone}>
                          {user.sellerProfile.phoneNumber}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.profileCardWarning}>
                      Du behöver lägga till en adress!
                    </Text>
                  )}
                </View>
                <View style={styles.profileCardRight}>
                  <Text style={styles.profileCardLink}>
                    {user.sellerProfile ? 'Ändra' : 'Lägg till'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.searchContainer}>
            <Input
              placeholder="Sök loppis eller område..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEventCard}
            contentContainerStyle={styles.listContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Ingen loppmarknad hittades</Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Försök med en annan sökning'
                    : 'Det finns inga tillgängliga loppisar just nu'}
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.xxl,
  },
  header: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: theme.fontSize.xxl,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  searchContainer: {
    padding: theme.spacing.md,
  
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  eventCardWrapper: {
    position: 'relative',
  },
  selectedEventCard: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
  },
  selectedBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  selectedBadgeText: {
    fontFamily: theme.fonts.button,
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
  },
  joinButton: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  joinButtonText: {
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontFamily: theme.fonts.subheading,
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
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
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  profileText: {
    fontFamily: theme.fonts.body,
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
  profileCard: {
    backgroundColor: theme.colors.surfaceLightest,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileCardLeft: {
    flex: 1,
  },
  profileCardTitle: {
    fontFamily: theme.fonts.subheading,
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  profileCardAddress: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: 2,
  },
  profileCardPhone: {
    fontFamily: theme.fonts.caption,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  profileCardWarning: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.sm,
    color: '#D97706',
  },
  profileCardRight: {
    marginLeft: theme.spacing.md,
  },
  profileCardLink: {
    fontFamily: theme.fonts.button,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
  expandedContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  expandedContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  expandedForm: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expandedFormTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  eventDetails: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  eventDetailRow: {
    marginBottom: theme.spacing.sm,
  },
  eventDetailLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  eventDetailValue: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  dateSelectionContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  dateSelectionTitle: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  dateSelectionSubtitle: {
    fontFamily: theme.fonts.caption,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  dateChip: {
    backgroundColor: theme.colors.surfaceLightest,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  dateChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dateChipDay: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dateChipDaySelected: {
    color: theme.colors.white,
  },
  dateChipDate: {
    fontFamily: theme.fonts.button,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  dateChipDateSelected: {
    color: theme.colors.white,
  },
  selectedDatesCount: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});
