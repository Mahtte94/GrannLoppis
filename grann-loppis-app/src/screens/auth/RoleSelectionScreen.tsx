import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { theme } from '../../styles/theme';

export default function RoleSelectionScreen() {
  const { setUser } = useAuth();

  const selectRole = (role: UserRole) => {
    // Simulate login with selected role
    setUser({
      id: 'mock-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      role: role,
      createdAt: new Date(),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Välj din roll</Text>
      <Text style={styles.subtitle}>Hur vill du använda GrannLoppis?</Text>

      <TouchableOpacity
        style={styles.roleButton}
        onPress={() => selectRole(UserRole.ORGANIZER)}
      >
        <Text style={styles.roleTitle}>Arrangör</Text>
        <Text style={styles.roleDescription}>Skapa och hantera evenemang</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleButton}
        onPress={() => selectRole(UserRole.SELLER)}
      >
        <Text style={styles.roleTitle}>Säljare</Text>
        <Text style={styles.roleDescription}>Gå med i evenemang och sälj dina saker</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleButton}
        onPress={() => selectRole(UserRole.BUYER)}
      >
        <Text style={styles.roleTitle}>Köpare</Text>
        <Text style={styles.roleDescription}>Bläddra bland evenemang och hitta fynd</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
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
    textAlign: 'center',
  },
  roleButton: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  roleTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  roleDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
});
