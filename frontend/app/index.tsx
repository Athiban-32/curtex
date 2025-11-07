import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Auto navigate to tabs after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Ionicons name="business" size={80} color="#4CAF50" />
        <Text style={styles.title}>Curtex Furnishing</Text>
        <Text style={styles.subtitle}>Production Management System</Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Ionicons name="cube" size={32} color="#4CAF50" />
          <Text style={styles.featureText}>Inventory Management</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="color-palette" size={32} color="#4CAF50" />
          <Text style={styles.featureText}>Dyeing Orders</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="document-text" size={32} color="#4CAF50" />
          <Text style={styles.featureText}>Job Cards & Tracking</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="cut" size={32} color="#4CAF50" />
          <Text style={styles.featureText}>Stitching Work Orders</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(tabs)/dashboard')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.footer}>Powered by Firebase & React Native</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 24,
  },
});
