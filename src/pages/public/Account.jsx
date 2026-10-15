import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { updateDisplayName } from '../../services/users.js';
import { Input } from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageLoader } from '../../components/ui/Feedback.jsx';
import { ROLES } from '../../lib/constants.js';

export default function Account() {
  useDocumentTitle('Account');
  const { user, loading, profile, role, displayName, isStaff } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: '/account' }} replace />;

  const value = name ?? displayName;

  async function save(e) {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    try {
      await updateDisplayName(user.uid, value);
      toast.success('Your name was updated.');
      setName(null);
    } catch {
      toast.error('Could not save your name.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-x pb-8 pt-12 sm:pt-16">
      <p className="eyebrow">Your account</p>
      <h1 className="display mt-3 text-6xl text-ink sm:text-7xl">Account</h1>
      <div className="mt-12 grid max-w-3xl gap-6">
        <form onSubmit={save} className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">Profile</h2>
          <div className="mt-4 space-y-4">
            <Input label="Display name" value={value} onChange={(e) => setName(e.target.value)} maxLength={80} />
            <Input label="Email" value={user.email} disabled readOnly />
            <div className="flex items-center gap-3 text-sm text-ink-2">Role <Badge tone={ROLES[role]?.tone}>{ROLES[role]?.label}</Badge></div>
          </div>
          <Button type="submit" className="mt-5" loading={busy} disabled={value.trim() === (profile?.displayName ?? '')}>Save changes</Button>
        </form>
        <div className="flex flex-wrap gap-3">
          <Button as={Link} to="/reservations" variant="outline">My reservations</Button>
          <Button as={Link} to="/favorites" variant="outline">Favourites</Button>
          {isStaff && <Button as={Link} to="/console" variant="accent">Open console</Button>}
        </div>
      </div>
    </div>
  );
}
