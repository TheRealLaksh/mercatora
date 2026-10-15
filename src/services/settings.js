import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { ValidationError, hasErrors, validateSettings } from '../lib/schemas.js';
import { stageAudit } from './audit.js';

export const settingsRef = () => doc(db, 'settings', 'mall');

export async function saveSettings(data) {
  const errors = validateSettings(data);
  if (hasErrors(errors)) throw new ValidationError(errors);
  const batch = writeBatch(db);
  batch.set(settingsRef(), { ...data, updatedAt: serverTimestamp() });
  stageAudit(batch, 'SETTINGS_UPDATED', 'Mall information updated', 'settings', 'mall');
  await batch.commit();
}
