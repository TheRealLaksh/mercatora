import { useMemo, useState } from 'react';
import { CalendarX } from 'lucide-react';
import OfferCard from '../../components/shop/OfferCard.jsx';
import { Segmented } from '../../components/ui/Tabs.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { isCurrent, publishedOffersQuery } from '../../services/offers.js';

export default function WhatsOn() {
  useDocumentTitle("What's on");
  const { data, loading, error } = useCollection(() => publishedOffersQuery(), []);
  const [tab, setTab] = useState('all');

  const current = useMemo(
    () => data.filter((o) => isCurrent(o)).sort((a, b) => a.startsAt.seconds - b.startsAt.seconds),
    [data],
  );
  const shown = tab === 'all' ? current : current.filter((o) => o.kind === (tab === 'offers' ? 'offer' : 'event'));

  return (
    <div className="container-x pb-8 pt-12 sm:pt-16">
      <header className="max-w-3xl">
        <p className="eyebrow">Happening at Mercatora</p>
        <h1 className="display mt-3 text-6xl text-ink sm:text-7xl">What's on</h1>
        <p className="mt-4 text-lg text-ink-2">Seasonal offers from our stores and events across the building. Expired items disappear on their own.</p>
      </header>
      <div className="mt-10">
        <Segmented
          label="Filter"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'all', label: 'Everything', count: current.length },
            { id: 'offers', label: 'Offers', count: current.filter((o) => o.kind === 'offer').length },
            { id: 'events', label: 'Events', count: current.filter((o) => o.kind === 'event').length },
          ]}
        />
      </div>
      <div className="mt-10">
        {error ? (
          <ErrorState />
        ) : loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-96" />)}</div>
        ) : shown.length === 0 ? (
          <EmptyState icon={CalendarX} title="Nothing on right now" body="Check back soon. New offers and events are added every week." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{shown.map((o) => <OfferCard key={o.id} offer={o} as="h2" />)}</div>
        )}
      </div>
    </div>
  );
}
