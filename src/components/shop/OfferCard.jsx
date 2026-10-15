import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Tag } from 'lucide-react';
import { ArtCover, SmartImage } from '../art/Art.jsx';
import Badge from '../ui/Badge.jsx';
import { formatDateRange, timeToGo } from '../../lib/format.js';

export default function OfferCard({ offer, compact = false, as: Heading = 'h3' }) {
  const isEvent = offer.kind === 'event';
  const Icon = isEvent ? CalendarDays : Tag;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`relative overflow-hidden ${compact ? 'aspect-[16/9]' : 'aspect-[16/10]'} bg-sunken`}>
        <SmartImage
          src={offer.imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          fallback={<ArtCover seed={offer.id + offer.title} category={isEvent ? 'Entertainment' : 'Fashion'} label={offer.title} />}
        />
        <Badge tone={isEvent ? 'info' : 'brass'} className="absolute left-3 top-3 !bg-paper/90 backdrop-blur">
          <Icon className="size-3" aria-hidden="true" /> {isEvent ? 'Event' : 'Offer'}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-brass">{timeToGo(offer.startsAt, offer.endsAt)}</p>
        <Heading className="display mt-1.5 text-[1.7rem] leading-tight text-ink">{offer.title}</Heading>
        {offer.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-2">{offer.description}</p>}
        <div className="mt-auto space-y-1.5 pt-4 text-xs text-muted">
          <p className="flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />{formatDateRange(offer.startsAt, offer.endsAt)}</p>
          {(offer.location || offer.shopName) && (
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {offer.shopId ? (
                <span>
                  <Link to={`/stores/${offer.shopId}`} className="font-medium text-ink underline-offset-2 hover:underline">{offer.shopName}</Link>
                  {offer.location ? `, ${offer.location}` : ''}
                </span>
              ) : (
                offer.location
              )}
            </p>
          )}
          {offer.code && <p className="pt-1">Use code <span className="rounded bg-sunken px-1.5 py-0.5 font-mono font-semibold tracking-wider text-ink">{offer.code}</span></p>}
        </div>
      </div>
    </article>
  );
}
