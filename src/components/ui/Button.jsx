import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-ink text-paper hover:bg-ink-2 disabled:bg-line-strong disabled:text-muted',
  accent: 'bg-brass-fill text-[#16130e] hover:brightness-105 disabled:opacity-50',
  outline: 'border border-line-strong bg-transparent text-ink hover:bg-sunken disabled:text-muted',
  soft: 'bg-sunken text-ink hover:bg-line disabled:text-muted',
  ghost: 'bg-transparent text-ink hover:bg-sunken disabled:text-muted',
  danger: 'bg-clay text-white hover:brightness-110 disabled:opacity-50',
  dangerSoft: 'bg-clay-soft text-clay hover:brightness-95 disabled:opacity-50',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
  icon: 'size-10 justify-center',
  iconSm: 'size-8 justify-center',
};

const Button = forwardRef(function Button(
  { as: Tag = 'button', variant = 'primary', size = 'md', loading = false, className = '', children, disabled, type, ...rest },
  ref,
) {
  const isButton = Tag === 'button';
  return (
    <Tag
      ref={ref}
      type={isButton ? type ?? 'button' : undefined}
      disabled={isButton ? disabled || loading : undefined}
      aria-disabled={!isButton && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      className={`inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-medium transition-[background,color,filter,transform] duration-150 active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </Tag>
  );
});

export default Button;
