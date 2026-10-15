// Grants the administrator role to an existing account in your REAL Firebase project.
// Roles cannot be set from the browser, so the first administrator is created here.
//
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
//   node scripts/make-admin.mjs you@example.com
//
// Sign up in the app first so the account exists. Never commit the service account file.
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email>');
  process.exit(1);
}

initializeApp();
const user = await getAuth().getUserByEmail(email);
await getFirestore()
  .collection('users')
  .doc(user.uid)
  .set(
    { displayName: user.displayName || email.split('@')[0], email, role: 'admin', shopIds: [], favorites: [], createdAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
console.log(`${email} is now an administrator. They may need to sign out and in again.`);
