import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { LocationInput } from '../../components/common/LocationInput';
import { Button } from '../../components/common/Button';
import { theme } from '../../styles/theme';
import { participantsService } from '../../services/firebase/participants.service';
import { userService } from '../../services/firebase/user.service';
import { eventsService } from '../../services/firebase/events.service';
import { useAuth } from '../../context/AuthContext';
import { Participant, Event, Coordinates } from '../../types';

export default function AddAddressScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useAuth();
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [errors, setErrors] = useState({ address: '' });
  const [loading, setLoading] = useState(false);
  const [checkingActive, setCheckingActive] = useState(true);
  const [hasActiveParticipations, setHasActiveParticipations] = useState(false);
  const [activeEvents, setActiveEvents] = useState<Array<{ participation: Participant; event: Event | null }>>([]);

  // Load existing profile and check for active participations
  useEffect(() => {
    const loadProfileAndCheckActive = async () => {
      if (!user) return;

      try {
        // Load existing seller profile
        if (user.sellerProfile) {
          setAddress(user.sellerProfile.address || '');
          if (user.sellerProfile.coordinates) {
            setCoordinates(user.sellerProfile.coordinates);
          }
        }

        // Check for active participations
        const { hasActiveParticipations: isActive, participations } =
          await participantsService.getActiveParticipations(user.id);

        setHasActiveParticipations(isActive);

        // Load event details for active participations
        if (isActive) {
          const eventsWithDetails = await Promise.all(
            participations.map(async (participation) => {
              try {
                const event = await eventsService.getEventById(participation.eventId);
                return { participation, event };
              } catch (err) {
                console.error('Error loading event:', err);
                return { participation, event: null };
              }
            })
          );
          setActiveEvents(eventsWithDetails);
        }
      } catch (err) {
        console.error('Error loading profile or checking active participations:', err);
        Alert.alert('Fel', 'Kunde inte ladda din profil. Försök igen.');
      } finally {
        setCheckingActive(false);
      }
    };

    loadProfileAndCheckActive();
  }, [user]);

  const validateForm = () => {
    const newErrors = { address: '' };
    let isValid = true;

    if (!address.trim()) {
      newErrors.address = 'Adress krävs';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleGetLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Tillåtelse nekad', 'Platsåtkomst krävs för att använda din nuvarande plats.');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});

      // Set coordinates from current location
      setCoordinates({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      // Use reverse geocoding to get address from coordinates
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocoded && geocoded.length > 0) {
        const result = geocoded[0];
        const addressParts = [
          result.street,
          result.streetNumber,
          result.postalCode,
          result.city,
        ].filter(Boolean);

        const formattedAddress = addressParts.join(' ');
        setAddress(formattedAddress);
        setErrors({ ...errors, address: '' });
      }
    } catch (err) {
      console.error('Error getting location:', err);
      Alert.alert('Fel', 'Kunde inte hämta din plats. Försök igen.');
    }
  };

  const handleExitEvent = async (participantId: string, eventName: string) => {
    Alert.alert(
      'Lämna evenemang',
      `Är du säker på att du vill lämna "${eventName}"? Du behöver ansöka igen om du vill gå med igen.`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Lämna',
          style: 'destructive',
          onPress: async () => {
            try {
              await participantsService.removeParticipant(participantId);
              Alert.alert('Klart!', 'Du har lämnat evenemanget.');

              // Reload the active participations
              if (user) {
                const { hasActiveParticipations: isActive, participations } =
                  await participantsService.getActiveParticipations(user.id);
                setHasActiveParticipations(isActive);

                if (isActive) {
                  const eventsWithDetails = await Promise.all(
                    participations.map(async (participation) => {
                      try {
                        const event = await eventsService.getEventById(participation.eventId);
                        return { participation, event };
                      } catch (err) {
                        return { participation, event: null };
                      }
                    })
                  );
                  setActiveEvents(eventsWithDetails);
                } else {
                  setActiveEvents([]);
                }
              }
            } catch (err) {
              console.error('Error leaving event:', err);
              Alert.alert('Fel', 'Kunde inte lämna evenemanget. Försök igen.');
            }
          },
        },
      ]
    );
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) return;

    if (!user) {
      Alert.alert('Fel', 'Du måste vara inloggad för att uppdatera din profil.');
      return;
    }

    if (hasActiveParticipations) {
      Alert.alert(
        'Kan inte ändra adress',
        'Du måste lämna alla aktiva evenemang innan du kan ändra din adress.'
      );
      return;
    }

    setLoading(true);
    try {
      // Use coordinates from autocomplete or "Use my location" if available, otherwise geocode
      let finalCoordinates = coordinates;

      if (!finalCoordinates) {
        try {
          const geocoded = await Location.geocodeAsync(address);

          if (geocoded && geocoded.length > 0) {
            finalCoordinates = {
              lat: geocoded[0].latitude,
              lng: geocoded[0].longitude,
            };
            console.log('Geocoded address to coordinates:', finalCoordinates);
          } else {
            Alert.alert(
              'Varning',
              'Kunde inte hitta koordinater för adressen. Din plats kanske inte visas korrekt på kartan. Vill du fortsätta ändå?',
              [
                { text: 'Avbryt', style: 'cancel', onPress: () => setLoading(false) },
                {
                  text: 'Fortsätt',
                  onPress: async () => {
                    await saveSellerProfile({ lat: 0, lng: 0 });
                  },
                },
              ]
            );
            return;
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          Alert.alert(
            'Varning',
            'Kunde inte konvertera adressen till koordinater. Din plats kanske inte visas korrekt på kartan. Vill du fortsätta ändå?',
            [
              { text: 'Avbryt', style: 'cancel', onPress: () => setLoading(false) },
              {
                text: 'Fortsätt',
                onPress: async () => {
                  await saveSellerProfile({ lat: 0, lng: 0 });
                },
              },
            ]
          );
          return;
        }
      } else {
        console.log('Using coordinates from selection or current location:', finalCoordinates);
      }

      await saveSellerProfile(finalCoordinates);
    } catch (err) {
      console.error('Error saving address:', err);
      Alert.alert('Fel', 'Kunde inte spara adressen. Försök igen.');
      setLoading(false);
    }
  };

  const saveSellerProfile = async (coords: { lat: number; lng: number }) => {
    try {
      if (!user) return;

      await userService.updateUserProfile(user.id, {
        sellerProfile: {
          address,
          coordinates: coords,
        },
      });

      // Update the local user state
      setUser({
        ...user,
        sellerProfile: {
          address,
          coordinates: coords,
        },
      });

      Alert.alert(
        'Klart!',
        'Din säljarprofil har uppdaterats. Du kan nu ansöka om att gå med i evenemang.',
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
    } catch (err) {
      console.error('Error saving seller profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (checkingActive) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar...</Text>
      </View>
    );
  }

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
          <Text style={styles.title}>Min adress</Text>
          <Text style={styles.subtitle}>
            Din adress visas på evenemangskartan när du går med i ett evenemang
          </Text>

          {hasActiveParticipations && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ Du är aktiv i evenemang</Text>
              <Text style={styles.warningText}>
                Du måste lämna alla aktiva evenemang innan du kan ändra din adress.
              </Text>

              {activeEvents.map(({ participation, event }) => (
                <View key={participation.id} style={styles.activeEventCard}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>
                      {event?.name || 'Okänt evenemang'}
                    </Text>
                    <Text style={styles.eventStatus}>
                      Status:{' '}
                      {participation.status === 'approved' ? 'Godkänd' : 'Väntar på godkännande'}
                    </Text>
                  </View>
                  <Button
                    title="Lämna"
                    onPress={() =>
                      handleExitEvent(participation.id, event?.name || 'detta evenemang')
                    }
                    variant="outline"
                    style={styles.exitButton}
                  />
                </View>
              ))}
            </View>
          )}

          <View style={styles.form}>
            <LocationInput
              label="Adress"
              placeholder="T.ex. Vasastan, Stockholm eller Göteborg"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                setCoordinates(null); // Clear coordinates when text changes manually
                setErrors({ ...errors, address: '' });
              }}
              onLocationSelect={(location) => {
                setAddress(location.description);
                setCoordinates({ lat: location.lat, lng: location.lng });
                setErrors({ ...errors, address: '' });
              }}
              error={errors.address}
            />

            <Button
              title="Använd min plats"
              onPress={handleGetLocation}
              variant="outline"
              style={styles.locationButton}
              disabled={hasActiveParticipations}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Din adress kommer att vara synliga för köpare på kartan. Se till
                att informationen är korrekt så att köpare hittar dig!
              </Text>
            </View>

            <Button
              title="Spara adress"
              onPress={handleSaveAddress}
              loading={loading}
              disabled={loading || hasActiveParticipations}
              style={styles.saveButton}
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
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
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
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  warningTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: theme.spacing.sm,
  },
  warningText: {
    fontSize: theme.fontSize.sm,
    color: '#856404',
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  activeEventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  eventStatus: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  exitButton: {
    marginLeft: theme.spacing.sm,
    minWidth: 80,
  },
  form: {
    width: '100%',
  },
  locationButton: {
    marginBottom: theme.spacing.md,
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
  saveButton: {
    marginBottom: theme.spacing.md,
  },
});
