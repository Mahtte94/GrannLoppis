import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { theme } from '../../styles/theme';
import { participantsService } from '../../services/firebase/participants.service';
import { useAuth } from '../../context/AuthContext';
import { SellerStackParamList } from '../../types/navigation.types';

export default function AddAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SellerStackParamList, 'AddAddress'>>();
  const { user } = useAuth();
  const [address, setAddress] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({ address: '', displayName: '', description: '' });
  const [loading, setLoading] = useState(false);

  const event = route.params?.event;

  const validateForm = () => {
    const newErrors = { address: '', displayName: '', description: '' };
    let isValid = true;

    if (!address.trim()) {
      newErrors.address = 'Address is required';
      isValid = false;
    }

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
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

  const handleSaveAddress = async () => {
    if (!validateForm()) return;

    if (!event) {
      Alert.alert('Fel', 'Evenemangsinformation saknas. Försök gå med i evenemanget igen.');
      return;
    }

    if (!user) {
      Alert.alert('Fel', 'Du måste vara inloggad för att gå med i ett evenemang.');
      return;
    }

    setLoading(true);
    try {
      // Geocode the address to get coordinates
      let coordinates = { lat: 0, lng: 0 };

      try {
        const geocoded = await Location.geocodeAsync(address);

        if (geocoded && geocoded.length > 0) {
          coordinates = {
            lat: geocoded[0].latitude,
            lng: geocoded[0].longitude,
          };
          console.log('Geocoded address to coordinates:', coordinates);
        } else {
          Alert.alert(
            'Varning',
            'Kunde inte hitta koordinater för adressen. Din plats kanske inte visas korrekt på kartan. Vill du fortsätta ändå?',
            [
              { text: 'Avbryt', style: 'cancel', onPress: () => setLoading(false) },
              { text: 'Fortsätt', onPress: async () => {
                await saveParticipant(coordinates);
              }},
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
            { text: 'Fortsätt', onPress: async () => {
              await saveParticipant(coordinates);
            }},
          ]
        );
        return;
      }

      await saveParticipant(coordinates);
    } catch (err) {
      console.error('Error saving address:', err);
      Alert.alert('Fel', 'Kunde inte spara adressen. Försök igen.');
      setLoading(false);
    }
  };

  const saveParticipant = async (coordinates: { lat: number; lng: number }) => {
    try {
      await participantsService.joinEvent(
        event!.id,
        user!.id,
        displayName,
        address,
        coordinates,
        description
      );

      Alert.alert(
        'Klart!',
        'Din adress har lagts till. Du kan nu börja lägga till föremål att sälja.',
        [{ text: 'OK', onPress: () => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}]
      );
    } catch (err) {
      console.error('Error saving participant:', err);
      throw err;
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
          <Text style={styles.title}>Lägg till din adress</Text>
          <Text style={styles.subtitle}>
            Din adress kommer att visas på evenemangskartan
          </Text>

          <View style={styles.form}>
            <Input
              label="Visningsnamn"
              placeholder="T.ex. Anna's Loppis"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                setErrors({ ...errors, displayName: '' });
              }}
              error={errors.displayName}
            />

            <Input
              label="Adress"
              placeholder="Gatunamn 123, Stockholm"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                setErrors({ ...errors, address: '' });
              }}
              error={errors.address}
              multiline
              numberOfLines={2}
            />

            <Button
              title="Använd min plats"
              onPress={handleGetLocation}
              variant="outline"
              style={styles.locationButton}
            />

            <Input
              label="Beskrivning"
              placeholder="Kort beskrivning av vad du säljer..."
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                setErrors({ ...errors, description: '' });
              }}
              error={errors.description}
              multiline
              numberOfLines={4}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Din adress kommer att vara synlig för köpare på kartan. Se till att adressen är korrekt så att köpare hittar dig!
              </Text>
            </View>

            <Button
              title="Spara adress"
              onPress={handleSaveAddress}
              loading={loading}
              disabled={loading}
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
