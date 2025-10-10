import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { eventsService, authService } from '../../services/firebase';
import { auth } from '../../../firebase.config';
import { theme } from '../../styles/theme';

export default function CreateEventScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [area, setArea] = useState('');
  const [date, setDate] = useState('');
  const [errors, setErrors] = useState({ eventName: '', area: '', date: '' });
  const [loading, setLoading] = useState(false);

  const testFirebaseAuth = async () => {
    console.log('=== FIREBASE AUTH TEST ===');
    console.log('Firebase Auth instance:', auth);
    console.log('Current Firebase user:', auth.currentUser);
    console.log('Context user:', user);

    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        console.log('Auth token exists:', !!token);
        console.log('Token preview:', token.substring(0, 50) + '...');
      } catch (error) {
        console.error('Error getting token:', error);
      }
    } else {
      console.log('NO FIREBASE USER - NOT AUTHENTICATED!');
    }

    Alert.alert(
      'Debug Info',
      `Firebase User: ${auth.currentUser ? 'YES' : 'NO'}\nContext User: ${user ? 'YES' : 'NO'}\nUser ID: ${user?.id || 'N/A'}\n\nCheck console for details`
    );
  };

  const validateForm = () => {
    const newErrors = { eventName: '', area: '', date: '' };
    let isValid = true;

    if (!eventName.trim()) {
      newErrors.eventName = 'Event name is required';
      isValid = false;
    }

    if (!area.trim()) {
      newErrors.area = 'Area is required';
      isValid = false;
    }

    if (!date.trim()) {
      newErrors.date = 'Date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create an event');
      return;
    }

    setLoading(true);
    try {
      // Debug: Log current user and auth state
      console.log('Current user:', user);
      console.log('User ID:', user.id);

      // Parse the date string to a Date object
      const eventDate = new Date(date);

      if (isNaN(eventDate.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format');
        setLoading(false);
        return;
      }

      console.log('Creating event with data:', {
        name: eventName,
        area: area,
        date: eventDate,
        organizerId: user.id,
      });

      // Create the event in Firebase
      const createdEvent = await eventsService.createEvent({
        name: eventName,
        area: area,
        date: eventDate,
        organizerId: user.id,
      });

      console.log('Event created successfully:', createdEvent);

      // Clear form after successful creation
      setEventName('');
      setArea('');
      setDate('');

      // Show success message with event code
      Alert.alert(
        'Event Created!',
        `Your event "${createdEvent.name}" has been created successfully!\n\nEvent Code: ${createdEvent.eventCode}\n\nShare this code with sellers so they can join your event.`,
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
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Error', error.message || 'Failed to create event. Please try again.');
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
          <Text style={styles.title}>Skapa ett nytt evenemang</Text>
          <Text style={styles.subtitle}>
            Fyll i informationen nedan för att skapa ditt loppis-evenemang
          </Text>

          <View style={styles.form}>
            <Input
              label="Evenemang namn"
              placeholder="T.ex. Storloppiset i Vasastan"
              value={eventName}
              onChangeText={(text) => {
                setEventName(text);
                setErrors({ ...errors, eventName: '' });
              }}
              error={errors.eventName}
            />

            <Input
              label="Område"
              placeholder="T.ex. Vasastan, Stockholm"
              value={area}
              onChangeText={(text) => {
                setArea(text);
                setErrors({ ...errors, area: '' });
              }}
              error={errors.area}
            />

            <Input
              label="Datum"
              placeholder="YYYY-MM-DD (t.ex. 2025-10-15)"
              value={date}
              onChangeText={(text) => {
                setDate(text);
                setErrors({ ...errors, date: '' });
              }}
              error={errors.date}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Efter att du skapat eventet får du en unik kod som säljare kan använda för att gå med.
              </Text>
            </View>

            <Button
              title="Debug: Test Auth"
              onPress={testFirebaseAuth}
              variant="outline"
              style={styles.debugButton}
            />

            <Button
              title="Skapa evenemang"
              onPress={handleCreateEvent}
              loading={loading}
              disabled={loading}
              style={styles.createButton}
            />

            <Button
              title="Logga ut"
              onPress={async () => {
                try {
                  await authService.logout();
                } catch (error) {
                  console.error('Logout error:', error);
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
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  debugButton: {
    marginBottom: theme.spacing.md,
  },
  createButton: {
    marginBottom: theme.spacing.md,
  },
});
