import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../lib/firebase.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/** Downscales large photos in the browser so uploads stay quick and under the 5 MB rule. */
export async function compressImage(file, maxDim = 1600, quality = 0.85) {
  if (!ALLOWED.includes(file.type)) throw new Error('Use a JPEG, PNG or WebP image.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < MAX_BYTES / 2) {
    bitmap.close?.();
    return file;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
}

/**
 * Uploads to media/{kind}/{scope}/{timestamp}-{name}. Returns the public URL.
 * kind: shops | products | offers. scope: the shop id (or "mall" for mall wide offers).
 */
export async function uploadImage({ kind, scope, file, onProgress }) {
  const prepared = await compressImage(file);
  if (prepared.size > MAX_BYTES) throw new Error('That image is over 5 MB even after compression.');
  const safe = prepared.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const path = `media/${kind}/${scope}/${Date.now()}-${safe}`;
  const task = uploadBytesResumable(ref(storage, path), prepared, { contentType: prepared.type });
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(snap.bytesTransferred / snap.totalBytes),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref)),
    );
  });
}
