import { useMemo, useState } from 'react';
import { Pencil, ShieldCheck } from 'lucide-react';
import { DataTable, PageHeader, SearchBox } from '../../components/console/ui.jsx';
import { useConsole } from '../../components/console/ConsoleContext.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { Skeleton } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { setUserAccess, usersQuery } from '../../services/users.js';
import { ROLES } from '../../lib/constants.js';
import { formatDate } from '../../lib/format.js';

export default function Users() {
  useDocumentTitle('People');
  const { user } = useAuth();
  const { shops, byId } = useConsole();
  const toast = useToast();
  const { data, loading } = useCollection(() => usersQuery(), []);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [role, setRole] = useState('shopper');
  const [linked, setLinked] = useState([]);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data
      .filter((u) => (roleFilter === 'all' || u.role === roleFilter) && (!t || `${u.displayName} ${u.email}`.toLowerCase().includes(t)))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [data, q, roleFilter]);

  function open(u) {
    setEditing(u);
    setRole(u.role);
    setLinked(u.shopIds ?? []);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await setUserAccess(editing, { role, shopIds: linked });
      toast.success(`${editing.displayName} is now ${ROLES[role].label.toLowerCase()}.`);
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const isSelf = editing?.id === user?.uid;

  return (
    <>
      <PageHeader eyebrow="Access" title="People" description="Everyone who has signed up. Promote someone to store owner and link them to their store so they can manage it." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name or email" className="w-full sm:w-72" />
        <select aria-label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 rounded-full border border-line-strong bg-surface px-4 text-sm">
          <option value="all">Any role</option>
          {Object.entries(ROLES).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>
        <p className="ml-auto text-sm text-muted tabular">{rows.length} of {data.length}</p>
      </div>
      {loading ? <Skeleton className="h-64 rounded-2xl" /> : (
        <DataTable
          caption="People"
          rows={rows}
          empty="Nobody matches."
          columns={[
            { key: 'name', header: 'Person', render: (u) => (<div><p className="font-medium text-ink">{u.displayName}{u.id === user?.uid && <span className="ml-2 text-xs font-normal text-muted">You</span>}</p><p className="text-xs text-muted">{u.email}</p></div>) },
            { key: 'role', header: 'Role', render: (u) => <Badge tone={ROLES[u.role]?.tone}>{ROLES[u.role]?.label ?? u.role}</Badge> },
            { key: 'stores', header: 'Stores', render: (u) => (u.shopIds?.length ? u.shopIds.map((id) => byId[id]?.name ?? 'Removed store').join(', ') : <span className="text-muted">None</span>) },
            { key: 'joined', header: 'Joined', render: (u) => <span className="text-muted">{formatDate(u.createdAt, { year: 'numeric' })}</span> },
            { key: 'a', header: <span className="sr-only">Actions</span>, align: 'right', render: (u) => <Button variant="ghost" size="iconSm" onClick={() => open(u)} aria-label={`Change access for ${u.displayName}`}><Pencil className="size-4" /></Button> },
          ]}
        />
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Change access" description={editing ? `${editing.displayName}, ${editing.email}` : ''}>
        {editing && (
          <form onSubmit={save} className="space-y-5">
            <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} hint={isSelf ? 'You cannot remove your own administrator access.' : undefined} disabled={isSelf}>
              {Object.entries(ROLES).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
            </Select>
            {role === 'owner' && (
              <fieldset>
                <legend className="mb-2 text-[0.8rem] font-medium text-ink">Stores they manage</legend>
                <div className="max-h-60 divide-y divide-line overflow-y-auto rounded-xl border border-line-strong">
                  {shops.map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-sunken">
                      <input type="checkbox" className="size-4 accent-[var(--moss)]" checked={linked.includes(s.id)} onChange={(e) => setLinked((l) => (e.target.checked ? [...l, s.id] : l.filter((x) => x !== s.id)))} />
                      <span className="flex-1 text-ink">{s.name}</span>
                      <span className="text-xs text-muted">{s.unitId}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {role === 'admin' && !isSelf && (
              <p className="flex gap-2 rounded-xl bg-warn-soft p-3 text-sm text-warn"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Administrators can change every store, user and setting. Grant this carefully.</p>
            )}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={busy}>Save access</Button></div>
          </form>
        )}
      </Modal>
    </>
  );
}
