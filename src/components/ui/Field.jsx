import { forwardRef, useId } from 'react';

const control =
  'w-full rounded-lg border border-line-strong bg-surface px-3.5 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-ink-2/50 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass-fill/40 disabled:bg-sunken disabled:text-muted aria-[invalid=true]:border-clay aria-[invalid=true]:ring-clay/20';

export function Field({ label, hint, error, required, children, className = '', htmlFor }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="text-[0.8rem] font-medium text-ink">
          {label}
          {required && (
            <span className="text-clay" aria-hidden="true">
              {' '}*
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-clay" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, hint, error, required, className = '', containerClass = '', id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={containerClass}>
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${control} h-11 ${className}`}
        {...rest}
      />
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, hint, error, required, className = '', containerClass = '', id, rows = 4, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={containerClass}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${control} resize-y py-3 leading-relaxed ${className}`}
        {...rest}
      />
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, hint, error, required, className = '', containerClass = '', id, children, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={containerClass}>
      <select
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${control} h-11 appearance-none bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat pr-9 ${className}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23857a6a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
});

export function Switch({ checked, onChange, label, description, id }) {
  const auto = useId();
  const sid = id ?? auto;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={sid} className="text-sm font-medium text-ink">
          {label}
        </label>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-moss' : 'bg-line-strong'}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}
