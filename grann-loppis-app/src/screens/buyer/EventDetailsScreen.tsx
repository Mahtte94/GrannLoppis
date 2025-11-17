import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  RouteProp,
  useRoute,
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { BuyerStackParamList, Event, EventStatus } from "../../types";
import { theme } from "../../styles/theme";
import { eventsService } from "../../services/firebase";
import {
  getEventStatus,
  getStatusText,
  formatDateRange,
  getDaysBetween,
} from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import { useAnimatedHeader } from "../../hooks/useAnimatedHeader";

type EventDetailsScreenRouteProp = RouteProp<
  BuyerStackParamList,
  "EventDetails"
>;
type EventDetailsScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<BuyerStackParamList, "EventDetails">,
  BottomTabNavigationProp<any>
>;

export default function EventDetailsScreen() {
  const route = useRoute<EventDetailsScreenRouteProp>();
  const navigation = useNavigation<EventDetailsScreenNavigationProp>();
  const { user } = useAuth();
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  // Use animated header hook
  const { handleScroll } = useAnimatedHeader({
    startFadeAt: 20,
    endFadeAt: 50,
  });

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);

      // Fetch real event from Firebase
      const fetchedEvent = await eventsService.getEventById(eventId);
      console.log("Fetched event:", fetchedEvent);

      setEvent(fetchedEvent);
    } catch (error) {
      console.error("Error loading event:", error);
      Alert.alert("Fel", "Kunde inte ladda loppis. Försök igen.");
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar loppmarknaden...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Loppmarknaden hittades inte</Text>
      </View>
    );
  }

  // Calculate the actual status based on the event date range
  const actualStatus = getEventStatus(event.startDate, event.endDate);
  const statusText = getStatusText(actualStatus);
  const numDays = getDaysBetween(event.startDate, event.endDate);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(actualStatus) },
            ]}
          >
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.location}>{event.area}</Text>
          <Text style={styles.date}>
            {formatDateRange(event.startDate, event.endDate)}
            {numDays > 1 && ` (${numDays} dagar)`}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Säljare</Text>
            <Text style={styles.infoValue}>{event.participants}</Text>
          </View>
        </View>

        {event.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Om loppmarknaden</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() =>
              navigation.navigate("EventMap", { eventId: event.id })
            }
          >
            <Text style={styles.mapButtonText}>Visa säljare på karta</Text>
          </TouchableOpacity>

          {!user && (
            <TouchableOpacity
              style={styles.sellerButton}
              onPress={() =>
                navigation.navigate("AuthTab", { screen: "Register" })
              }
            >
              <Text style={styles.sellerButtonText}>
                Vill du vara med och sälja? Registrera dig här som säljare
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    justifyContent: "center",
    alignItems: "center",
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
    paddingTop: theme.spacing.xxl,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: "bold",
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
    fontWeight: "600",
  },
  infoSection: {
    flexDirection: "row",
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  descriptionSection: {
    paddingHorizontal: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
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
    gap: theme.spacing.md,
  },
  mapButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    shadowColor: theme.colors.surface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mapButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sellerButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sellerButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
});
