import { useMemo, useState } from 'react';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase.js';
import { DataTable, PageHeader, SearchBox } from '../../components/console/ui.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { formatDateTime } from '../../lib/format.js';

const tone = (a) => (/DELETED|CANCELLED|EXPIRED|ARCHIVED|HIDDEN/.test(a) ? 'danger' : /CREATED|CONFIRMED|COLLECTED|RESTORED|PUBLISHED/.test(a) ? 'ok' : /ACCESS|SETTINGS/.test(a) ? 'brass' : 'neutral');

export default function Audit() {
  useDocumentTitle('Audit log');
  const { data, loading, error } = useCollection(() => query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(300)), []);
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState('all');

  const entities = useMemo(() => [...new Set(data.map((l) => l.entity).filter(Boolean))].sort(), [data]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.filter((l) => (entity === 'all' || l.entity === entity) && (!t || `${l.action} ${l.details} ${l.performedBy}`.toLowerCase().includes(t)));
  }, [data, q, entity]);

  return (
    <>
      <PageHeader eyebrow="Accountability" title="Audit log" description="Every change to stores, products, reservations, reviews and access, with who made it. Entries cannot be edited or deleted." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search actions, details or people" className="w-full sm:w-80" />
        <select aria-label="Entity" value={entity} onChange={(e) => setEntity(e.target.value)} className="h-10 rounded-full border border-line-strong bg-surface px-4 text-sm">
          <option value="all">Everything</option>
          {entities.map((x) => (<option key={x} value={x}>{x}</option>))}
        </select>
        <p className="ml-auto text-sm text-muted tabular">Showing {rows.length} of the latest {data.length}</p>
      </div>
      {error ? <ErrorState /> : loading ? <Skeleton className="h-64 rounded-2xl" /> : (
        <DataTable
          caption="Audit log"
          rows={rows}
          empty="No matching entries."
          columns={[
            { key: 'time', header: 'When', render: (l) => <span className="whitespace-nowrap text-muted tabular">{formatDateTime(l.timestamp)}</span> },
            { key: 'action', header: 'Action', render: (l) => <Badge tone={tone(l.action)} className="font-mono !text-[0.68rem]">{l.action}</Badge> },
            { key: 'details', header: 'Details', className: 'max-w-md', render: (l) => <span className="text-ink-2">{l.details}</span> },
            { key: 'by', header: 'By', render: (l) => <span className="text-muted">{l.performedBy}</span> },
          ]}
        />
      )}
    </>
  );
}
