import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList, UserRole } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/firebase';
import { theme } from '../../styles/theme';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ORGANIZER);
  const [errors, setErrors] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
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

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.register({
        email: email.trim(),
        password: password,
        displayName: displayName.trim(),
        role: selectedRole,
      });

      console.log('Registration successful! AuthContext will update automatically.');
      // Don't set loading to false here - let AuthContext handle navigation
      // The loading state will persist until the user is fully logged in
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registrering misslyckades', error.message || 'Kunde inte skapa konto');
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  roleLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
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
});
