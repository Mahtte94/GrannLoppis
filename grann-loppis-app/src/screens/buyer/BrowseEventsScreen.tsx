import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BuyerStackParamList, MainTabParamList, Event } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { EventCard } from '../../components/EventCard';
import { Loading } from '../../components/common/Loading';
import { LocationSearchBar, LocationResult } from '../../components/common/LocationSearchBar';
import { eventsService } from '../../services/firebase';
import { theme } from '../../styles/theme';
import { getUserLocation, calculateDistance } from '../../utils/helpers';

type BrowseEventsScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<BuyerStackParamList, 'BrowseEvents'>,
  BottomTabNavigationProp<MainTabParamList>
>;

// Type for event with pre-calculated distance
type EventWithDistance = Event & { distance?: number };

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export default function BrowseEventsScreen() {
  const navigation = useNavigation<BrowseEventsScreenNavigationProp>();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

  const handleRegisterNavigation = () => {
    // Navigate to the Auth tab (which defaults to Register screen)
    navigation.navigate('AuthTab');
  };

  const loadEvents = useCallback(async (forceRefresh = false) => {
    try {
      // Check if cache is still valid
      const now = Date.now();
      const isCacheValid = events.length > 0 && (now - lastLoadTime) < CACHE_DURATION;

      if (isCacheValid && !forceRefresh) {
        console.log('Using cached events');
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('Fetching fresh events from Firebase');

      // Get user's location
      const location = await getUserLocation();

      // Fetch real events from Firebase
      const fetchedEvents = await eventsService.getAllEvents();
      console.log('Fetched events:', fetchedEvents);

      // Calculate distances once and add to events
      const eventsWithDistance: EventWithDistance[] = fetchedEvents.map(event => ({
        ...event,
        distance: location ? calculateDistance(location, event.coordinates) : undefined,
      }));

      // Sort events by distance if user location is available
      if (location) {
        eventsWithDistance.sort((a, b) => {
          const distanceA = a.distance ?? Infinity;
          const distanceB = b.distance ?? Infinity;
          return distanceA - distanceB;
        });
      }

      setEvents(eventsWithDistance);
      setLastLoadTime(Date.now());
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [events.length, lastLoadTime]);

  // Reload events whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('BrowseEventsScreen focused, reloading events...');
      loadEvents();
    }, [loadEvents])
  );

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  const handleLocationSelect = (location: LocationResult) => {
    console.log('Location selected:', location);

    if (location.coordinates) {
      // Navigate to map tab with the selected location
      navigation.navigate('MapTab', {
        screen: 'AllEventsMap',
        params: {
          location: location.coordinates,
          locationName: location.description,
        },
      });
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents(true); // Force refresh
    setRefreshing(false);
  }, [loadEvents]);

  if (loading) {
    return <Loading message="Laddar evenemang..." fullScreen />;
  }

  // Get featured events (upcoming events)
  const featuredEvents = events.slice(0, 3);
  const upcomingEvents = events.filter(e => new Date(e.startDate) > new Date());

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroOverlay}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Upptäck loppmarknader nära dig</Text>
            <Text style={styles.heroSubtitle}>
              Hitta unika fynd och lokala skatter på loppmarknader i ditt område
            </Text>

            {/* Location Search Bar */}
            <View style={styles.searchBarContainer}>
              <LocationSearchBar
                onLocationSelect={handleLocationSelect}
                placeholder="Sök efter plats..."
              />
            </View>

            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('MapTab')}
            >
              <Text style={styles.ctaButtonText}>Utforska nu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{events.length}</Text>
          <Text style={styles.statLabel}>Loppisar</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{upcomingEvents.length}</Text>
          <Text style={styles.statLabel}>Kommande</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{events.reduce((sum, e) => sum + e.participants, 0)}</Text>
          <Text style={styles.statLabel}>Säljare</Text>
        </View>
      </View>

      {/* Featured Events Section */}
      {featuredEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Loppisar i närheten</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Se alla</Text>
            </TouchableOpacity>
          </View>
          {featuredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={handleEventPress}
              distance={event.distance}
            />
          ))}
        </View>
      )}

      {/* How It Works Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Så fungerar det</Text>
        <View style={styles.howItWorksCard}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🔍</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Hitta loppisar</Text>
              <Text style={styles.featureDescription}>
                Bläddra bland loppmarknader i ditt område
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🗺️</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Visa på karta</Text>
              <Text style={styles.featureDescription}>
                Se exakt var säljarna finns
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🛍️</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Handla lokalt</Text>
              <Text style={styles.featureDescription}>
                Besök säljare och hitta unika fynd
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer CTA - Only show for logged out users */}
      {!user && (
        <View style={styles.footerCTA}>
          <Text style={styles.footerTitle}>Vill du arrangera en loppmarknad?</Text>
          <Text style={styles.footerSubtitle}>
            Skapa och hantera dina egna loppmarknader
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRegisterNavigation}
          >
            <Text style={styles.secondaryButtonText}>Kom igång</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Hero Section
  hero: {
    minHeight: 420,
    backgroundColor: theme.colors.surface,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl * 2,
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
  },
  heroTitle: {
    fontSize: theme.fontSize.xxl + 4,
    fontWeight: '700',
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    opacity: 0.85,
    lineHeight: 24,
    fontWeight: '400',
  },
  searchBarContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
    zIndex: 1000,
  },
  ctaButton: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl + 8,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    boxShadow: '-4px 8px 8px 0px rgba(0, 0, 0, 0.3), inset -2px 2px 4px -4px rgba(255, 255, 255, 1)',
  },
  ctaButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Stats Section
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: 100,
    boxShadow: '-4px 8px 8px 0px rgba(0, 0, 0, 0.3), inset -2px 2px 4px -4px rgba(255, 255, 255, 1)',
  },
  statNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  // Section Styles
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // How It Works Card
  howItWorksCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    boxShadow: '-4px 8px 8px 0px rgba(0, 0, 0, 0.3), inset -2px 2px 4px -4px rgba(255, 255, 255, 1)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    opacity: 0.9,
    boxShadow: '-4px 8px 8px 0px rgba(0, 0, 0, 0.3), inset -2px 2px 4px -4px rgba(255, 255, 255, 1)',
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  // Footer CTA
  footerCTA: {
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  footerSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  secondaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl + 8,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    boxShadow: '-4px 8px 8px 0px rgba(0, 0, 0, 0.3), inset -2px 2px 4px -4px rgba(255, 255, 255, 1)',
  },
  secondaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Empty State
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
});
