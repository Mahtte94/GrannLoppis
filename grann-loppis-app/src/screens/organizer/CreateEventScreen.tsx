import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';

export default function CreateEventScreen() {
  const navigation = useNavigation();
  const { setUser } = useAuth();
  const [eventName, setEventName] = useState('');
  const [area, setArea] = useState('');
  const [date, setDate] = useState('');
  const [errors, setErrors] = useState({ eventName: '', area: '', date: '' });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = { eventName: '', area: '', date: '' };
    let isValid = true;

    if (!eventName.trim()) {
      newErrors.eventName = 'Event name is required';
      isValid = false;
    }

    if (!area.trim()) {
      newErrors.area = 'Area is required';
      isValid = false;
    }

    if (!date.trim()) {
      newErrors.date = 'Date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement actual event creation logic with Firebase
      // const eventData = {
      //   name: eventName,
      //   area: area,
      //   date: new Date(date),
      // };
      // await eventsService.createEvent(eventData);

      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Clear form after successful creation
      setEventName('');
      setArea('');
      setDate('');

      // Optionally navigate if there's a screen to go back to
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error creating event:', error);
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
          <Text style={styles.title}>Skapa ett nytt evenemang</Text>
          <Text style={styles.subtitle}>
            Fyll i informationen nedan för att skapa ditt loppis-evenemang
          </Text>

          <View style={styles.form}>
            <Input
              label="Evenemang namn"
              placeholder="T.ex. Storloppiset i Vasastan"
              value={eventName}
              onChangeText={(text) => {
                setEventName(text);
                setErrors({ ...errors, eventName: '' });
              }}
              error={errors.eventName}
            />

            <Input
              label="Område"
              placeholder="T.ex. Vasastan, Stockholm"
              value={area}
              onChangeText={(text) => {
                setArea(text);
                setErrors({ ...errors, area: '' });
              }}
              error={errors.area}
            />

            <Input
              label="Datum"
              placeholder="YYYY-MM-DD (t.ex. 2025-10-15)"
              value={date}
              onChangeText={(text) => {
                setDate(text);
                setErrors({ ...errors, date: '' });
              }}
              error={errors.date}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Efter att du skapat eventet får du en unik kod som säljare kan använda för att gå med.
              </Text>
            </View>

            <Button
              title="Skapa evenemang"
              onPress={handleCreateEvent}
              loading={loading}
              disabled={loading}
              style={styles.createButton}
            />

            <Button
              title="Avbryt"
              onPress={() => setUser(null)}
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
    marginBottom: theme.spacing.md,
  },
});
