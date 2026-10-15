import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const env = import.meta.env;

export const useEmulators = env.VITE_USE_EMULATORS === 'true';

const liveConfig = {
  apiKey: env.VITE_API_KEY,
  authDomain: env.VITE_AUTH_DOMAIN,
  projectId: env.VITE_PROJECT_ID,
  storageBucket: env.VITE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_MESSAGING_SENDER_ID,
  appId: env.VITE_APP_ID,
};

const emulatorConfig = {
  apiKey: 'demo-key',
  authDomain: 'demo-mercatora.firebaseapp.com',
  projectId: 'demo-mercatora',
  storageBucket: 'demo-mercatora.appspot.com',
  appId: 'demo-app',
};

const config = useEmulators ? emulatorConfig : liveConfig;

const REQUIRED = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
export const missingConfig = REQUIRED.filter((k) => !config[k]);
export const isConfigured = missingConfig.length === 0;

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isConfigured) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  if (useEmulators) {
    const host = env.VITE_EMULATOR_HOST || '127.0.0.1';
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectStorageEmulator(storage, host, 9199);
  }
}

export { app, auth, db, storage };
