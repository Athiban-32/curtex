import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';

// This layout file hides the header for the auth stack
export default function AuthLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}