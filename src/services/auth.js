import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';

const MESSAGES = {
  'auth/invalid-credential': 'That email and password do not match.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/user-not-found': 'No account uses that email.',
  'auth/wrong-password': 'That email and password do not match.',
  'auth/email-already-in-use': 'An account with that email already exists. Try signing in.',
  'auth/weak-password': 'Use at least 8 characters for your password.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'Network problem. Check your connection and try again.',
};

export function friendlyError(error) {
  return MESSAGES[error?.code] ?? error?.message ?? 'Something went wrong. Please try again.';
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await ensureProfile(cred.user);
  return cred.user;
}

export async function register({ name, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
  await ensureProfile(cred.user, name.trim());
  return cred.user;
}

export function logout() {
  return signOut(auth);
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

/** Creates users/{uid} as a shopper if it does not exist yet. Roles are never set from the client. */
export async function ensureProfile(user, name) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    displayName: name || user.displayName || user.email.split('@')[0],
    email: user.email,
    role: 'shopper',
    shopIds: [],
    favorites: [],
    createdAt: serverTimestamp(),
  });
}
