import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList } from '../../types';
import { theme } from '../../styles/theme';

type BrowseEventsScreenNavigationProp = StackNavigationProp<BuyerStackParamList, 'BrowseEvents'>;

export default function BrowseEventsScreen() {
  const navigation = useNavigation<BrowseEventsScreenNavigationProp>();

  // Mock event for testing
  const mockEventId = 'test-event-123';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse Events</Text>
        <Text style={styles.subtitle}>Find garage sales near you</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>Event list coming soon...</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('EventMap', { eventId: mockEventId })}
        >
          <Text style={styles.buttonText}>View Test Event Map</Text>
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
  content: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  placeholder: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
