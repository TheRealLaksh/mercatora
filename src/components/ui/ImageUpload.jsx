import { useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadImage } from '../../services/media.js';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * Uploads to Firebase Storage and hands back the URL via onChange.
 * `kind` and `scope` pick the storage folder (see storage.rules).
 */
export default function ImageUpload({ label, value, onChange, kind, scope, aspect = 'aspect-[4/3]', hint, disabled }) {
  const id = useId();
  const input = useRef(null);
  const toast = useToast();
  const [progress, setProgress] = useState(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProgress(0);
    try {
      const url = await uploadImage({ kind, scope, file, onProgress: setProgress });
      onChange(url);
    } catch (err) {
      console.error(err);
      toast.error(err.code === 'storage/unauthorized' ? 'You do not have permission to upload here.' : err.message || 'Upload failed.');
    } finally {
      setProgress(null);
    }
  }

  const busy = progress !== null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.8rem] font-medium text-ink" id={`${id}-label`}>
        {label}
      </span>
      <div className={`group relative ${aspect} w-full overflow-hidden rounded-xl border border-dashed border-line-strong bg-sunken`}>
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-center text-muted">
            <div>
              <ImagePlus className="mx-auto mb-1.5 size-6" aria-hidden="true" />
              <p className="text-xs">JPEG, PNG or WebP, up to 5 MB</p>
            </div>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-[#16130e]/60 text-white">
            <div className="text-center">
              <Loader2 className="mx-auto size-6 animate-spin" />
              <p className="mt-1 text-xs tabular">{Math.round(progress * 100)}%</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} disabled={disabled || busy} aria-labelledby={`${id}-label`} />
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={disabled || busy}
          className="rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-medium text-ink transition hover:bg-sunken disabled:opacity-50"
        >
          {value ? 'Replace image' : 'Upload image'}
        </button>
        {value && !busy && (
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-clay transition hover:bg-clay-soft"
          >
            <Trash2 className="size-3.5" aria-hidden="true" /> Remove
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
