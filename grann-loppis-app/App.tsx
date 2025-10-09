import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { View, Text, TextInput, StyleSheet } from "react-native";

export default function App() {
  const [text, setText] = useState("Edit me!");

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text style={styles.label}>Type something:</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Start typing..."
        />
        <Text style={styles.output}>You typed: {text}</Text>
      </View>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    marginBottom: 10,
  },
  output: {
    fontSize: 14,
    color: '#666',
  },
});
