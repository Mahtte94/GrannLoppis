import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/common/Input';
import { LocationInput } from '../../components/common/LocationInput';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { eventsService, authService } from '../../services/firebase';
import { auth } from '../../../firebase.config';
import { theme } from '../../styles/theme';
import { getDaysBetween, geocodeAddress } from '../../utils/helpers';
import { Coordinates } from '../../types';

export default function CreateEventScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [area, setArea] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState({ eventName: '', area: '', startDate: '', endDate: '' });
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
    const newErrors = { eventName: '', area: '', startDate: '', endDate: '' };
    let isValid = true;

    if (!eventName.trim()) {
      newErrors.eventName = 'Evenemang namn krävs';
      isValid = false;
    }

    if (!area.trim()) {
      newErrors.area = 'Område krävs';
      isValid = false;
    }

    if (!startDate) {
      newErrors.startDate = 'Startdatum krävs';
      isValid = false;
    }

    if (!endDate) {
      newErrors.endDate = 'Slutdatum krävs';
      isValid = false;
    }

    // Validate date range if both dates are provided
    if (startDate && endDate) {
      if (endDate < startDate) {
        newErrors.endDate = 'Slutdatum måste vara efter startdatum';
        isValid = false;
      }

      const numDays = getDaysBetween(startDate, endDate);
      if (numDays > 7) {
        newErrors.endDate = 'Evenemang kan max vara 7 dagar';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    if (!user) {
      Alert.alert('Fel', 'Du måste vara inloggad för att skapa ett evenemang');
      return;
    }

    setLoading(true);
    try {
      // Debug: Log current user and auth state
      console.log('Current user:', user);
      console.log('User ID:', user.id);

      // Geocode the area to get coordinates
      console.log('Geocoding area:', area);
      const geocodedCoordinates = await geocodeAddress(area);

      if (!geocodedCoordinates) {
        Alert.alert(
          'Ogiltigt område',
          'Det angivna området kunde inte hittas. Vänligen ange en giltig plats (t.ex. "Vasastan, Stockholm" eller "Göteborg").'
        );
        setLoading(false);
        return;
      }

      console.log('Area geocoded successfully:', geocodedCoordinates);
      setCoordinates(geocodedCoordinates);

      // startDate and endDate are already Date objects
      const numDays = getDaysBetween(startDate, endDate);

      console.log('Creating event with data:', {
        name: eventName,
        area: area,
        coordinates: geocodedCoordinates,
        startDate: startDate,
        endDate: endDate,
        organizerId: user.id,
        numDays: numDays,
      });

      // Create the event in Firebase
      const createdEvent = await eventsService.createEvent({
        name: eventName,
        area: area,
        coordinates: geocodedCoordinates,
        startDate: startDate,
        endDate: endDate,
        organizerId: user.id,
      });

      console.log('Event created successfully:', createdEvent);

      // Clear form after successful creation
      setEventName('');
      setArea('');
      setCoordinates(null);
      setStartDate(null);
      setEndDate(null);

      // Show success message with event code
      Alert.alert(
        'Evenemang skapat!',
        `Ditt evenemang "${createdEvent.name}" har skapats!\n\nEvenemangskod: ${createdEvent.eventCode}\n\n${numDays > 1 ? `Längd: ${numDays} dagar\n\n` : ''}Dela denna kod med säljare så att de kan gå med i ditt evenemang.`,
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
      Alert.alert('Fel', error.message || 'Kunde inte skapa evenemang. Försök igen.');
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

            <LocationInput
              label="Område"
              placeholder="T.ex. Vasastan, Stockholm eller Göteborg"
              value={area}
              onChangeText={(text) => {
                setArea(text);
                setCoordinates(null); // Clear coordinates when text changes
                setErrors({ ...errors, area: '' });
              }}
              error={errors.area}
            />

            <DatePickerInput
              label="Startdatum"
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                setErrors({ ...errors, startDate: '' });
              }}
              error={errors.startDate}
              minimumDate={new Date()}
            />

            <DatePickerInput
              label="Slutdatum"
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
                setErrors({ ...errors, endDate: '' });
              }}
              error={errors.endDate}
              minimumDate={startDate || new Date()}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Ditt evenemang kan vara mellan 1 och 7 dagar långt. Efter att du skapat eventet får du en unik kod som säljare kan använda för att gå med.
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
