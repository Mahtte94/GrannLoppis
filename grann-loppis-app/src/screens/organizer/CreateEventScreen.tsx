import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../../components/common/Input';
import { LocationInput } from '../../components/common/LocationInput';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { eventsService } from '../../services/firebase';
import { theme } from '../../styles/theme';
import { getDaysBetween, geocodeAddress } from '../../utils/helpers';
import { Coordinates } from '../../types';

export default function CreateEventScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [eventName, setEventName] = useState('');
  const [area, setArea] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState({ eventName: '', area: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = { eventName: '', area: '', startDate: '', endDate: '' };
    let isValid = true;

    if (!eventName.trim()) {
      newErrors.eventName = 'Loppmarknads namn krävs';
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
        newErrors.endDate = 'Loppmarknad kan max vara 7 dagar';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    if (!user) {
      Alert.alert('Fel', 'Du måste vara inloggad för att skapa en loppmarknad.');
      return;
    }

    setLoading(true);
    try {
      // Debug: Log current user and auth state
      console.log('Current user:', user);
      console.log('User ID:', user.id);

      // Get coordinates - either from autocomplete selection or geocode manually entered text
      let finalCoordinates = coordinates;

      if (!finalCoordinates) {
        console.log('Geocoding area:', area);
        finalCoordinates = await geocodeAddress(area);

        if (!finalCoordinates) {
          Alert.alert(
            'Ogiltigt område',
            'Det angivna området kunde inte hittas. Vänligen välj en plats från förslagen eller ange en giltig plats (t.ex. "Vasastan, Stockholm" eller "Göteborg").'
          );
          setLoading(false);
          return;
        }

        console.log('Area geocoded successfully:', finalCoordinates);
        setCoordinates(finalCoordinates);
      } else {
        console.log('Using coordinates from autocomplete:', finalCoordinates);
      }

      // startDate and endDate are guaranteed to be non-null after validation
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      const numDays = getDaysBetween(startDate, endDate);

      console.log('Creating event with data:', {
        name: eventName,
        area: area,
        coordinates: finalCoordinates,
        startDate: startDate,
        endDate: endDate,
        organizerId: user.id,
        numDays: numDays,
      });

      // Create the event in Firebase
      const createdEvent = await eventsService.createEvent({
        name: eventName,
        area: area,
        coordinates: finalCoordinates,
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

      // Show success message
      Alert.alert(
        'Loppmarknad skapat!',
        `Din loppmarknad "${createdEvent.name}" har skapats!\n\n${numDays > 1 ? `Längd: ${numDays} dagar\n\n` : ''}Säljare kan nu ansöka om att delta i din loppmarknad. Du kan godkänna eller avslå ansökningar från deltagarlistan.`,
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
      Alert.alert('Fel', error.message || 'Kunde inte skapa loppmarknad. Försök igen.');
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
        contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Skapa en ny loppis</Text>
          <Text style={styles.subtitle}>
            Fyll i informationen nedan för att skapa din loppis
          </Text>

          <View style={styles.form}>
            <Input
              label="Loppis namn"
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
                setCoordinates(null); // Clear coordinates when text changes manually
                setErrors({ ...errors, area: '' });
              }}
              onLocationSelect={(location) => {
                setArea(location.description);
                setCoordinates({ lat: location.lat, lng: location.lng });
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
                Din loppmarknad kan vara mellan 1 och 7 dagar långt. Efter att du skapat eventet kan säljare ansöka om att delta. Du kommer att kunna granska och godkänna eller avslå varje ansökan.
              </Text>
            </View>

            <Button
              title="Skapa evenemang"
              onPress={handleCreateEvent}
              loading={loading}
              disabled={loading}
              style={styles.createButton}
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
  createButton: {
    marginBottom: theme.spacing.xxl,
  }
});
