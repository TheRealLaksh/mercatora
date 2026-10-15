import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquareQuote, Trash2 } from 'lucide-react';
import { Stars, RatingInput } from '../ui/Stars.jsx';
import Button from '../ui/Button.jsx';
import { Textarea } from '../ui/Field.jsx';
import { EmptyState, Skeleton } from '../ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { deleteMyReview, getMyReview, saveReview, shopReviewsQuery } from '../../services/reviews.js';
import { distribution } from '../../lib/ratings.js';
import { formatDate } from '../../lib/format.js';
import { ValidationError } from '../../lib/schemas.js';

export default function Reviews({ shop }) {
  const { user, displayName, isOwner, shopIds } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const location = useLocation();
  const { data, loading } = useCollection(() => shopReviewsQuery(shop.id), [shop.id]);
  const [mine, setMine] = useState(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const reviews = useMemo(
    () => [...data].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)),
    [data],
  );
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = distribution(reviews);
  const ownsShop = isOwner && shopIds.includes(shop.id);

  useEffect(() => {
    let live = true;
    if (!user) {
      setMine(null);
      return undefined;
    }
    getMyReview(shop.id, user.uid)
      .then((r) => live && setMine(r))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [user, shop.id, data]);

  function startEdit() {
    setRating(mine?.rating ?? 0);
    setText(mine?.text ?? '');
    setEditing(true);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await saveReview({ shopId: shop.id, rating, text, authorName: displayName });
      toast.success(mine ? 'Your review was updated.' : 'Thanks, your review is live.');
      // Close the form first, so a click on Edit made while we were saving is not undone afterwards.
      setEditing(false);
      setRating(0);
      setText('');
      setMine(await getMyReview(shop.id, user.uid));
    } catch (err) {
      if (!(err instanceof ValidationError)) console.error(err);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!(await confirm({ title: 'Delete your review?', body: 'This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' }))) return;
    try {
      await deleteMyReview(shop.id);
      setMine(null);
      toast.success('Your review was deleted.');
    } catch {
      toast.error('Could not delete your review.');
    }
  }

  const showForm = user && !ownsShop && (!mine || editing);

  return (
    <section aria-labelledby="reviews-title" id="reviews">
      <div className="flex flex-col gap-8 md:flex-row md:gap-14">
        <div className="md:w-64 md:shrink-0">
          <h2 id="reviews-title" className="display text-4xl text-ink">Reviews</h2>
          {reviews.length > 0 ? (
            <div className="mt-5">
              <div className="flex items-end gap-3">
                <span className="display text-6xl leading-none tabular text-ink">{avg.toFixed(1)}</span>
                <div className="pb-1.5">
                  <Stars value={avg} />
                  <p className="mt-1 text-xs text-muted">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-1.5" aria-label="Rating breakdown">
                {[5, 4, 3, 2, 1].map((n) => (
                  <li key={n} className="flex items-center gap-2 text-xs text-muted">
                    <span className="w-3 tabular">{n}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                      <span className="block h-full rounded-full bg-brass-fill" style={{ width: `${(dist[n] / reviews.length) * 100}%` }} />
                    </span>
                    <span className="w-5 text-right tabular">{dist[n]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No ratings yet.</p>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {showForm && (
            <form onSubmit={submit} className="mb-8 rounded-2xl border border-line-strong bg-surface p-5" noValidate>
              <h3 className="text-sm font-semibold text-ink">{mine ? 'Edit your review' : 'Rate your visit'}</h3>
              <div className="mt-3"><RatingInput value={rating} onChange={setRating} error={error} /></div>
              <Textarea containerClass="mt-3" label="Your thoughts (optional)" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="What stood out? Service, range, value?" error={error} />
              <div className="mt-3 flex gap-2">
                <Button type="submit" loading={busy} disabled={rating === 0}>{mine ? 'Save changes' : 'Post review'}</Button>
                {editing && <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
              </div>
            </form>
          )}
          {!user && (
            <p className="mb-8 rounded-2xl border border-dashed border-line-strong p-5 text-sm text-ink-2">
              <Link to="/login" state={{ from: location.pathname }} className="font-semibold text-brass underline-offset-2 hover:underline">Sign in</Link> to rate this store.
            </p>
          )}

          {loading ? (
            <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          ) : reviews.length === 0 ? (
            <EmptyState icon={MessageSquareQuote} title="Be the first to review" body="Shoppers' honest notes help everyone pick where to go next." />
          ) : (
            <ul className="divide-y divide-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-6 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-brass-soft text-xs font-semibold text-brass">{r.authorName?.slice(0, 1).toUpperCase()}</span>
                      <div>
                        <p className="text-sm font-medium text-ink">{r.authorName}</p>
                        <p className="text-xs text-muted">{formatDate(r.createdAt, { year: 'numeric' })}</p>
                      </div>
                    </div>
                    <Stars value={r.rating} />
                  </div>
                  {r.text && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-2">{r.text}</p>}
                  {r.reply && (
                    <div className="mt-3 rounded-xl bg-sunken p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brass">Reply from {shop.name}</p>
                      <p className="mt-1 text-sm text-ink-2">{r.reply}</p>
                    </div>
                  )}
                  {user && r.uid === user.uid && (
                    <div className="mt-3 flex gap-3 text-xs">
                      <button type="button" onClick={startEdit} disabled={busy} className="font-medium text-brass hover:underline disabled:opacity-50">Edit</button>
                      <button type="button" onClick={remove} className="inline-flex items-center gap-1 font-medium text-clay hover:underline"><Trash2 className="size-3" aria-hidden="true" />Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
