import { useMemo, useState } from 'react';
import { EyeOff, MessageSquareQuote, Reply, RotateCcw, Trash2 } from 'lucide-react';
import { PageHeader, ShopFilter } from '../../components/console/ui.jsx';
import { useConsole } from '../../components/console/ConsoleContext.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Textarea } from '../../components/ui/Field.jsx';
import { EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { Stars } from '../../components/ui/Stars.jsx';
import { Segmented } from '../../components/ui/Tabs.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { adminDeleteReview, allReviewsQuery, replyToReview, setReviewStatus, staffShopReviewsQuery } from '../../services/reviews.js';
import { formatDate } from '../../lib/format.js';

export default function Reviews() {
  useDocumentTitle('Reviews');
  const { isAdmin } = useAuth();
  const { shops, byId, activeShopId, loading: shopsLoading } = useConsole();
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState('all');
  const [shopFilter, setShopFilter] = useState('');
  const [replying, setReplying] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const scope = isAdmin ? shopFilter : activeShopId;
  const { data, loading } = useCollection(
    () => (scope ? staffShopReviewsQuery(scope) : isAdmin ? allReviewsQuery() : null),
    [scope, isAdmin],
  );

  const sorted = useMemo(() => [...data].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)), [data]);
  const unanswered = sorted.filter((r) => r.status === 'published' && !r.reply);
  const hidden = sorted.filter((r) => r.status === 'hidden');
  const rows = tab === 'unanswered' ? unanswered : tab === 'hidden' ? hidden : sorted;

  const guard = async (fn, ok) => {
    try {
      await fn();
      toast.success(ok);
    } catch (err) {
      console.error(err);
      toast.error(err.code === 'permission-denied' ? 'You do not have permission to do that.' : err.message);
    }
  };

  async function sendReply(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    await guard(() => replyToReview(replying, text), 'Reply posted.');
    setBusy(false);
    setReplying(null);
  }

  if (!isAdmin && !shopsLoading && shops.length === 0) {
    return (<><PageHeader eyebrow="Feedback" title="Reviews" /><EmptyState icon={MessageSquareQuote} title="No store linked" body="Ask an administrator to link your account to a store first." /></>);
  }

  return (
    <>
      <PageHeader eyebrow="Feedback" title="Reviews" description={isAdmin ? 'Moderate what the public sees. Hidden reviews stay on record but leave the store page and the rating.' : 'Reply to shoppers. Your reply appears under their review.'} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented label="Filter reviews" value={tab} onChange={setTab} items={[{ id: 'all', label: 'All', count: sorted.length }, { id: 'unanswered', label: 'Awaiting reply', count: unanswered.length }, ...(isAdmin ? [{ id: 'hidden', label: 'Hidden', count: hidden.length }] : [])]} />
        {isAdmin && <ShopFilter shops={shops} value={shopFilter} onChange={setShopFilter} />}
      </div>

      {loading ? <Skeleton className="h-48 rounded-2xl" /> : rows.length === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="No reviews here" body="When shoppers rate a store, their reviews show up in this list." />
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Stars value={r.rating} />
                  <span className="text-sm font-medium text-ink">{r.authorName}</span>
                  {r.status === 'hidden' && <Badge tone="warn">Hidden</Badge>}
                </div>
                <p className="text-xs text-muted">{isAdmin && !scope ? `${byId[r.shopId]?.name ?? 'Store'} · ` : ''}{formatDate(r.createdAt, { year: 'numeric' })}</p>
              </div>
              {r.text ? <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-2">{r.text}</p> : <p className="mt-3 text-sm italic text-muted">Rating only.</p>}
              {r.reply && <div className="mt-3 rounded-xl bg-sunken p-3 text-sm text-ink-2"><span className="font-semibold text-brass">Reply: </span>{r.reply}</div>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => { setReplying(r); setText(r.reply ?? ''); }}><Reply className="size-4" aria-hidden="true" /> {r.reply ? 'Edit reply' : 'Reply'}</Button>
                {isAdmin && (
                  <>
                    <Button variant="soft" size="sm" onClick={() => guard(() => setReviewStatus(r, r.status === 'hidden' ? 'published' : 'hidden'), r.status === 'hidden' ? 'Review restored.' : 'Review hidden.')}>
                      {r.status === 'hidden' ? <><RotateCcw className="size-4" aria-hidden="true" /> Restore</> : <><EyeOff className="size-4" aria-hidden="true" /> Hide</>}
                    </Button>
                    <Button variant="dangerSoft" size="sm" onClick={async () => { if (await confirm({ title: 'Delete this review?', body: 'It is removed permanently.', confirmLabel: 'Delete', tone: 'danger' })) guard(() => adminDeleteReview(r), 'Review deleted.'); }}><Trash2 className="size-4" aria-hidden="true" /> Delete</Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(replying)} onClose={() => setReplying(null)} title="Reply to review" description={replying ? `${replying.authorName} gave ${replying.rating} out of 5.` : ''} size="sm">
        <form onSubmit={sendReply} className="space-y-4">
          <Textarea label="Your reply" rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} placeholder="Thank them, or explain what you are doing about it." data-autofocus />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setReplying(null)}>Cancel</Button><Button type="submit" loading={busy} disabled={!text.trim()}>Post reply</Button></div>
        </form>
      </Modal>
    </>
  );
}
