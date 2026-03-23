import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import { apiRequest } from '@/lib/api';

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = 'minhas-tarefas-auth';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const session = JSON.parse(raw) as { token: string; user: AuthUser };
        if (__DEV__) {
          console.log('[auth] restored session', {
            hasToken: Boolean(session.token),
            tokenPreview: session.token ? `${session.token.slice(0, 16)}...` : null,
            tokenLength: session.token?.length ?? 0,
            userId: session.user?.id ?? null,
          });
        }
        setToken(session.token);
        setUser(session.user);
      })
      .finally(() => setReady(true));
  }, []);

  async function signIn(email: string, password: string) {
    const session = await apiRequest<{ token: string; user: AuthUser }>('/session', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (__DEV__) {
      console.log('[auth] signIn response', {
        hasToken: Boolean(session.token),
        tokenPreview: session.token ? `${session.token.slice(0, 16)}...` : null,
        tokenLength: session.token?.length ?? 0,
        userId: session.user?.id ?? null,
      });
    }

    setToken(session.token);
    setUser(session.user);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  async function signOut() {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ token, user, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.');
  return context;
}
