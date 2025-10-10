import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { theme } from '../../styles/theme';

export default function AddAddressScreen() {
  const navigation = useNavigation();
  const [address, setAddress] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({ address: '', displayName: '', description: '' });
  const [loading, setLoading] = useState(false);

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
      // TODO: Implement location services with expo-location
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // if (status !== 'granted') {
      //   Alert.alert('Permission denied', 'Location permission is required');
      //   return;
      // }
      // const location = await Location.getCurrentPositionAsync({});
      // Use reverse geocoding to get address from coordinates

      Alert.alert('Coming soon', 'Location services will be implemented soon');
    } catch (err) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement actual address saving logic with Firebase
      // const participantData = {
      //   address,
      //   displayName,
      //   description,
      //   coordinates: { lat: 0, lng: 0 }, // Get from geocoding
      // };
      // await participantsService.addParticipant(participantData);

      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Success!',
        'Your address has been added. You can now add items to sell.',
        [{ text: 'OK', onPress: () => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to save address. Please try again.');
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
