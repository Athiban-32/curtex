import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase.config'; // Use your existing firebase config
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// This component handles the auth logic
function AuthGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  useEffect(() => {
    if (loading) return; // Wait until we know the auth state

    const inAppGroup = segments[0] === '(tabs)';

    if (!user && inAppGroup) {
      // User is logged OUT, but trying to access the (tabs) group.
      // Redirect them to the welcome screen.
      router.replace('/');
    }
  }, [user, loading, segments, router]); // Re-run when user or segments change

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // This setup is correct.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      
      <Stack.Screen 
        name="job-card-form" 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="stitching-form" 
        options={{ presentation: 'modal' }} 
      />
    </Stack>
  );
}

// This is your main root layout
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthGuard />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});