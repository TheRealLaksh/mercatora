import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Wordmark } from '../../components/ui/Logo.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { ArtCover } from '../../components/art/Art.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { friendlyError } from '../../services/auth.js';
import { isEmail } from '../../lib/validate.js';

const COPY = {
  login: { title: 'Welcome back', sub: 'Sign in to see your reservations, favourites and, for store teams, the console.', cta: 'Sign in' },
  register: { title: 'Create your account', sub: 'Reserve products, save favourite stores and leave reviews.', cta: 'Create account' },
  reset: { title: 'Reset your password', sub: 'Enter your email and we will send you a link.', cta: 'Send reset link' },
};

export default function AuthPage({ mode = 'login' }) {
  useDocumentTitle(COPY[mode].title);
  const { user, loading, signIn, signUp, resetPassword, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const from = location.state?.from;

  if (!loading && user) return <Navigate to={from ?? (isStaff ? '/console' : '/')} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (mode === 'register' && !form.name.trim()) errs.name = 'Tell us your name.';
    if (!isEmail(form.email)) errs.email = 'Enter a valid email address.';
    if (mode !== 'reset') {
      if (!form.password) errs.password = 'Enter your password.';
      else if (mode === 'register' && form.password.length < 8) errs.password = 'Use at least 8 characters.';
    }
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
        toast.success('Signed in.');
      } else if (mode === 'register') {
        await signUp(form);
        toast.success('Welcome to Mercatora.');
      } else {
        await resetPassword(form.email);
        toast.success('If that email has an account, a reset link is on its way.');
        navigate('/login');
      }
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Mercatora home"><Wordmark /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" aria-hidden="true" /> Back to the mall</Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="display text-5xl text-ink">{COPY[mode].title}</h1>
          <p className="mt-3 text-ink-2">{COPY[mode].sub}</p>

          <form onSubmit={submit} noValidate className="mt-8 space-y-4">
            {mode === 'register' && <Input label="Full name" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" required />}
            <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" required />
            {mode !== 'reset' && (
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={set('password')}
                error={errors.password}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                hint={mode === 'register' ? 'At least 8 characters.' : undefined}
                required
              />
            )}
            {formError && <p role="alert" className="rounded-lg bg-clay-soft p-3 text-sm text-clay">{formError}</p>}
            <Button type="submit" size="lg" className="w-full" loading={busy}>{COPY[mode].cta}</Button>
          </form>

          <div className="mt-6 space-y-2 text-sm text-ink-2">
            {mode === 'login' && (
              <>
                <p><Link to="/forgot" className="font-medium text-brass hover:underline">Forgot your password?</Link></p>
                <p>New here? <Link to="/register" state={location.state} className="font-semibold text-ink underline underline-offset-4">Create an account</Link></p>
              </>
            )}
            {mode === 'register' && <p>Already have an account? <Link to="/login" state={location.state} className="font-semibold text-ink underline underline-offset-4">Sign in</Link></p>}
            {mode === 'reset' && <p><Link to="/login" className="font-semibold text-ink underline underline-offset-4">Back to sign in</Link></p>}
          </div>
        </div>
        <p className="text-xs text-muted">Store owners: sign in with the email your mall manager registered. Access is linked to your store by an administrator.</p>
      </div>
      <div className="relative hidden lg:block" aria-hidden="true">
        <ArtCover seed="auth-panel" category="Home" />
        <div className="absolute inset-0 grid place-items-end bg-gradient-to-t from-[#16130e]/70 via-transparent p-14">
          <p className="display max-w-md text-5xl leading-[1.05] text-white">Shop, dine and unwind under one roof.</p>
        </div>
      </div>
    </main>
  );
}
