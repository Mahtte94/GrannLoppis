import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/firebase';
import { theme } from '../../styles/theme';

export function AuthButton() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const handlePress = async () => {
    if (user) {
      // Logout
      Alert.alert(
        'Logga ut',
        'Är du säker på att du vill logga ut?',
        [
          {
            text: 'Avbryt',
            style: 'cancel',
          },
          {
            text: 'Logga ut',
            style: 'destructive',
            onPress: async () => {
              try {
                await authService.logout();
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Fel', 'Kunde inte logga ut. Försök igen.');
              }
            },
          },
        ]
      );
    } else {
      // Navigate to login screen in AuthTab
      // @ts-ignore - navigation type is complex with nested navigators
      navigation.navigate('AuthTab', { screen: 'Login' });
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      activeOpacity={0.7}
    >
      <Text style={styles.buttonText}>
        {user ? 'Logga ut' : 'Logga in'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
});
