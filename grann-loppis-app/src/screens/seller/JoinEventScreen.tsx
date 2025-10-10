import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { theme } from '../../styles/theme';

export default function JoinEventScreen() {
  const navigation = useNavigation();
  const [eventCode, setEventCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!eventCode.trim()) {
      setError('Event code is required');
      return false;
    }
    return true;
  };

  const handleJoinEvent = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement actual event joining logic with Firebase
      // const event = await eventsService.getEventByCode(eventCode);
      // if (!event) {
      //   setError('Invalid event code');
      //   return;
      // }

      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate to AddAddress screen to complete seller registration
      navigation.navigate('AddAddress' as never);
    } catch (err) {
      setError('Failed to join event. Please check the code and try again.');
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
          <Text style={styles.title}>Gå med i ett evenemang</Text>
          <Text style={styles.subtitle}>
            Ange evenemangskoden du fått från arrangören
          </Text>

          <View style={styles.form}>
            <Input
              label="Evenemangskod"
              placeholder="T.ex. ABC123"
              value={eventCode}
              onChangeText={(text) => {
                setEventCode(text.toUpperCase());
                setError('');
              }}
              error={error}
              autoCapitalize="characters"
              maxLength={10}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Vad händer härnäst?</Text>
              <Text style={styles.infoText}>
                • Du kommer att registrera din adress{'\n'}
                • Du kan börja lägga till dina föremål{'\n'}
                • Din plats visas på evenemangskartan
              </Text>
            </View>

            <Button
              title="Gå med"
              onPress={handleJoinEvent}
              loading={loading}
              disabled={loading}
              style={styles.joinButton}
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
    justifyContent: 'center',
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
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  infoLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  joinButton: {
    marginBottom: theme.spacing.md,
  },
});
