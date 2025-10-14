import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { theme } from '../../styles/theme';
import { eventsService } from '../../services/firebase/events.service';
import { SellerStackParamList } from '../../types/navigation.types';

type JoinEventScreenNavigationProp = StackNavigationProp<SellerStackParamList, 'JoinEvent'>;

export default function JoinEventScreen() {
  const navigation = useNavigation<JoinEventScreenNavigationProp>();
  const [eventCode, setEventCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!eventCode.trim()) {
      setError('Event code is required');
      return false;
    }
    return true;
  };

  const handleJoinEvent = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Search for event by event code
      const events = await eventsService.searchEvents(eventCode);

      if (events.length === 0) {
        setError('Invalid event code. Please check and try again.');
        setLoading(false);
        return;
      }

      const event = events[0]; // Take the first matching event

      // Navigate to AddAddress screen with event data
      navigation.navigate('AddAddress', {
        event: {
          id: event.id,
          eventCode: event.eventCode,
          name: event.name,
        },
      });
    } catch (err) {
      console.error('Error joining event:', err);
      setError('Failed to join event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Gå med i ett evenemang</Text>
          <Text style={styles.subtitle}>
            Ange evenemangskoden du fått från arrangören
          </Text>

          <View style={styles.form}>
            <Input
              label="Evenemangskod"
              placeholder="T.ex. ABC123"
              value={eventCode}
              onChangeText={(text) => {
                setEventCode(text.toUpperCase());
                setError('');
              }}
              error={error}
              autoCapitalize="characters"
              maxLength={10}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Vad händer härnäst?</Text>
              <Text style={styles.infoText}>
                • Du kommer att registrera din adress{'\n'}
                • Du kan börja lägga till dina föremål{'\n'}
                • Din plats visas på evenemangskartan
              </Text>
            </View>

            <Button
              title="Gå med"
              onPress={handleJoinEvent}
              loading={loading}
              disabled={loading}
              style={styles.joinButton}
            />

            <Button
              title="Avbryt"
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              }}
              variant="outline"
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  infoBox: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  infoLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  joinButton: {
    marginBottom: theme.spacing.md,
  },
});
