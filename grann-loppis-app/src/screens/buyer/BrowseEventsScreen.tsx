import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList, Event } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { EventCard } from '../../components/EventCard';
import { Loading } from '../../components/common/Loading';
import { eventsService } from '../../services/firebase';
import { theme } from '../../styles/theme';
import { getUserLocation, calculateDistance } from '../../utils/helpers';

type BrowseEventsScreenNavigationProp = StackNavigationProp<BuyerStackParamList, 'BrowseEvents'>;

// Type for event with pre-calculated distance
type EventWithDistance = Event & { distance?: number };

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export default function BrowseEventsScreen() {
  const navigation = useNavigation<BrowseEventsScreenNavigationProp>();
  const { user, setUser } = useAuth();
  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

  const handleAuthAction = () => {
    if (user) {
      // User is logged in, so log them out
      setUser(null);
    } else {
      // User is not logged in, navigate to login
      // Note: The navigation structure will automatically show the Auth tab
      setUser(null); // This will trigger the navigation to show Auth tab
    }
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
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('EventDetails', { eventId: events[0]?.id })}
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
        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🔍</Text>
            </View>
            <Text style={styles.featureTitle}>Hitta loppisar</Text>
            <Text style={styles.featureDescription}>
              Bläddra bland loppmarknader i ditt område
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🗺️</Text>
            </View>
            <Text style={styles.featureTitle}>Visa på karta</Text>
            <Text style={styles.featureDescription}>
              Se exakt var säljarna finns
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🛍️</Text>
            </View>
            <Text style={styles.featureTitle}>Handla lokalt</Text>
            <Text style={styles.featureDescription}>
              Besök säljare och hitta unika fynd
            </Text>
          </View>
        </View>
      </View>

      {/* Footer CTA */}
      <View style={styles.footerCTA}>
        <Text style={styles.footerTitle}>Vill du arrangera en loppmarknad?</Text>
        <Text style={styles.footerSubtitle}>
          Skapa och hantera dina egna loppmarknader
        </Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleAuthAction}
        >
          <Text style={styles.secondaryButtonText}>
            {user ? 'Gå till Min Loppis' : 'Kom igång'}
          </Text>
        </TouchableOpacity>
      </View>
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
    height: 300,
    backgroundColor: theme.colors.primary,
    position: 'relative',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 600,
  },
  heroTitle: {
    fontSize: theme.fontSize.xxl + 8,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 48,
  },
  heroSubtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    opacity: 0.95,
    lineHeight: 26,
  },
  ctaButton: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
  },
  // Stats Section
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  // Section Styles
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  seeAllText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  // Feature Grid
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  featureCard: {
    width: '30%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureEmoji: {
    fontSize: 32,
  },
  featureTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Footer CTA
  footerCTA: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  footerSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    opacity: 0.9,
  },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButtonText: {
    color: theme.colors.secondary,
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
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
