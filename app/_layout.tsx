import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/providers/auth-provider';

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f4efe6',
    card: '#fffaf2',
    border: '#dccdb8',
    primary: '#0f766e',
    text: '#221d18',
    notification: '#b45309',
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={appTheme}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f4efe6' },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="tasks" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="logs" />
          <Stack.Screen name="task/[id]" />
        </Stack>
        <StatusBar style="dark" />
      </AuthProvider>
    </ThemeProvider>
  );
}
