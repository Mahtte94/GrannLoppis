import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList, UserRole, Coordinates } from '../../types';
import { Input } from '../../components/common/Input';
import { LocationInput } from '../../components/common/LocationInput';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/firebase';
import { geocodeAddress } from '../../utils/helpers';
import { theme } from '../../styles/theme';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ORGANIZER);

  // Seller-specific fields
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  const [errors, setErrors] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      address: '',
    };
    let isValid = true;

    if (!displayName.trim()) {
      newErrors.displayName = 'Namn krävs';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email krävs';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Ogiltig email';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Lösenord krävs';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Lösenord måste vara minst 6 tecken';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Bekräfta ditt lösenord';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Lösenorden matchar inte';
      isValid = false;
    }

    // Validate seller-specific fields
    if (selectedRole === UserRole.SELLER) {
      if (!address.trim()) {
        newErrors.address = 'Adress krävs för säljare';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const registerInput: any = {
        email: email.trim(),
        password: password,
        displayName: displayName.trim(),
        role: selectedRole,
      };

      // Add seller profile if role is SELLER
      if (selectedRole === UserRole.SELLER) {
        // If coordinates were set from LocationInput autocomplete, use them
        // Otherwise, try to geocode the manually entered address
        let finalCoordinates = coordinates;

        if (!finalCoordinates) {
          console.log('Geocoding address:', address.trim());
          finalCoordinates = await geocodeAddress(address.trim());

          if (!finalCoordinates) {
            Alert.alert(
              'Ogiltig adress',
              'Kunde inte hitta adressen. Vänligen välj en adress från förslagen eller ange en mer specifik adress (t.ex. "Drottninggatan 1, Stockholm").'
            );
            setLoading(false);
            return;
          }

          console.log('Address geocoded to:', finalCoordinates);
        }

        registerInput.sellerProfile = {
          address: address.trim(),
          coordinates: finalCoordinates,
          ...(phoneNumber && { phoneNumber: phoneNumber.trim() }),
        };
      }

      await authService.register(registerInput);
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registrering misslyckades', error.message || 'Kunde inte skapa konto');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.title}>Skapa konto</Text>
          <Text style={styles.subtitle}>Registrera dig för att komma igång</Text>

          <View style={styles.form}>
            <Input
              label="Namn"
              placeholder="Ditt namn"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                setErrors({ ...errors, displayName: '' });
              }}
              error={errors.displayName}
              autoCapitalize="words"
            />

            <Input
              label="Email"
              placeholder="din@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: '' });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Lösenord"
              placeholder="Minst 6 tecken"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: '' });
              }}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
            />

            <Input
              label="Bekräfta lösenord"
              placeholder="Ange lösenordet igen"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors({ ...errors, confirmPassword: '' });
              }}
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.roleLabel}>Jag är en:</Text>
            <View style={styles.roleButtons}>
              <Button
                title="Arrangör"
                onPress={() => setSelectedRole(UserRole.ORGANIZER)}
                variant={selectedRole === UserRole.ORGANIZER ? 'primary' : 'outline'}
                style={styles.roleButton}
              />
              <Button
                title="Säljare"
                onPress={() => setSelectedRole(UserRole.SELLER)}
                variant={selectedRole === UserRole.SELLER ? 'primary' : 'outline'}
                style={styles.roleButton}
              />
            </View>

            {selectedRole === UserRole.SELLER && (
              <View style={styles.sellerFields}>
                <Text style={styles.sectionLabel}>Säljare information</Text>
                <LocationInput
                  label="Adress"
                  placeholder="T.ex. Drottninggatan 1, Stockholm"
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    setCoordinates(null); // Clear coordinates when text changes
                    setErrors({ ...errors, address: '' });
                  }}
                  onLocationSelect={(location) => {
                    setAddress(location.description);
                    setCoordinates({ lat: location.lat, lng: location.lng });
                    setErrors({ ...errors, address: '' });
                  }}
                  error={errors.address}
                />
              </View>
            )}

            <Button
              title="Registrera"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
            />

            <Button
              title="Har du redan ett konto? Logga in"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
                disabled={loading}
                style={styles.loginButton}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
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
    fontFamily: theme.fonts.heading,
    fontSize: theme.fontSize.xxl,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  roleLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  roleButton: {
    flex: 1,
  },
  registerButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sellerFields: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionLabel: {
    fontFamily: theme.fonts.subheading,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  loginButton: {
    marginBottom: theme.spacing.xxl,
  },
});
