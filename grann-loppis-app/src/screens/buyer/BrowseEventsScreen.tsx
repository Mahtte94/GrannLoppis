import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList, Event, EventStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { EventCard } from '../../components/EventCard';
import { Loading } from '../../components/common/Loading';
import { eventsService } from '../../services/firebase';
import { theme } from '../../styles/theme';

type BrowseEventsScreenNavigationProp = StackNavigationProp<BuyerStackParamList, 'BrowseEvents'>;

export default function BrowseEventsScreen() {
  const navigation = useNavigation<BrowseEventsScreenNavigationProp>();
  const { setUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [region] = useState<Region>({
    latitude: 59.3293,
    longitude: 18.0686,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const handleLogout = () => {
    setUser(null);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);

      // Fetch real events from Firebase
      const fetchedEvents = await eventsService.getAllEvents();
      console.log('Fetched events:', fetchedEvents);

      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  if (loading) {
    return <Loading message="Loading events..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Browse Events</Text>
            <Text style={styles.subtitle}>{events.length} events near you</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Change Role</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={handleEventPress} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events found</Text>
            </View>
          }
        />
      ) : (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          showsUserLocation={true}
        >
          {events.map((event, index) => {
            // Spread events around Stockholm for demo
            const lat = 59.3293 + (index - 1) * 0.015;
            const lng = 18.0686 + (index - 1) * 0.02;

            return (
              <Marker
                key={event.id}
                coordinate={{ latitude: lat, longitude: lng }}
                pinColor={event.status === EventStatus.ACTIVE ? theme.colors.success : theme.colors.secondary}
                onPress={() => handleEventPress(event)}
                title={event.name}
                description={`${event.participants} sellers • ${event.area}`}
              />
            );
          })}
        </MapView>
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
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
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
  logoutButton: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textLight,
  },
  toggleTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  map: {
    flex: 1,
  },
});
