import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, TabActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService, userService } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Login with Firebase
      const firebaseUser = await authService.login({ email, password });
      console.log('✅ Login successful! Firebase user:', firebaseUser.uid);

      // Fetch user profile and update context manually
      const userProfile = await userService.getUserProfile(firebaseUser.uid);
      console.log('✅ User profile fetched:', userProfile);

      if (userProfile) {
        // Update the auth context
        setUser(userProfile);
        console.log('✅ Auth context updated - waiting for tabs to update...');

        // Wait for tabs to update, then navigate
        setTimeout(() => {
          const targetTab = userProfile.role === 'organizer' ? 'OrganizerTab' : userProfile.role === 'seller' ? 'SellerTab' : 'BuyerTab';
          const parent = navigation.getParent();

          if (parent) {
            try {
              parent.dispatch(TabActions.jumpTo(targetTab));
              console.log(`✈️ Successfully navigated to ${targetTab}`);
            } catch (error) {
              console.log('✈️ Navigation failed:', error);
            }
          }
        }, 100);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setErrors({ ...errors, password: error.message || 'Invalid email or password' });
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
          <Text style={styles.title}>Välkommen!</Text>
          <Text style={styles.subtitle}>Logga in på ditt konto</Text>

          <View style={styles.form}>
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
              placeholder="Ange ditt lösenord"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: '' });
              }}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              title="Logga in"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
            />

            <Button
              title="Har du inget konto? Registrera dig"
              onPress={() => navigation.navigate('Register')}
              variant="outline"
              style={styles.registerButton}
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
  loginButton: {
    marginTop: theme.spacing.md,
  },
  registerButton: {
    marginTop: theme.spacing.md,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  successTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  successText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  successHint: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
});
