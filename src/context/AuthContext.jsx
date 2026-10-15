import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import * as authApi from '../services/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(
    () =>
      authApi.watchAuth((u) => {
        setUser(u);
        setAuthReady(true);
        if (!u) {
          setProfile(null);
          setProfileReady(true);
        } else {
          setProfileReady(false);
        }
      }),
    [],
  );

  useEffect(() => {
    if (!user) return undefined;
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setProfileReady(true);
      },
      (error) => {
        console.error('Profile failed:', error);
        setProfile(null);
        setProfileReady(true);
      },
    );
  }, [user]);

  const value = useMemo(() => {
    const role = user ? profile?.role ?? 'shopper' : 'guest';
    return {
      user,
      profile,
      role,
      shopIds: profile?.shopIds ?? [],
      favorites: profile?.favorites ?? [],
      isAdmin: role === 'admin',
      isOwner: role === 'owner',
      isStaff: role === 'admin' || role === 'owner',
      loading: !authReady || !profileReady,
      displayName: profile?.displayName ?? user?.displayName ?? user?.email?.split('@')[0] ?? '',
      signIn: authApi.login,
      signUp: authApi.register,
      signOut: authApi.logout,
      resetPassword: authApi.resetPassword,
    };
  }, [user, profile, authReady, profileReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
