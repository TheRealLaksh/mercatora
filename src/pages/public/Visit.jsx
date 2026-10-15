import { Bus, Car, Clock, Mail, MapPin, Phone, Zap } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import HoursList from '../../components/shop/HoursList.jsx';
import Button from '../../components/ui/Button.jsx';

export default function Visit() {
  useDocumentTitle('Plan your visit');
  const { settings, mallStatus } = useSettings();
  const status = mallStatus();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`;

  return (
    <div className="container-x pb-8 pt-12 sm:pt-16">
      <header className="max-w-3xl">
        <p className="eyebrow">Visitor information</p>
        <h1 className="display mt-3 text-6xl text-ink sm:text-7xl">Plan your visit</h1>
        <p className="mt-4 inline-flex items-center gap-2 text-lg text-ink-2">
          <span className={`size-2.5 rounded-full ${status.isOpen ? 'bg-ok' : 'bg-muted'}`} aria-hidden="true" />
          {status.isOpen ? 'We are open.' : 'We are closed right now.'} {status.text}.
        </p>
      </header>

      <div className="mt-14 grid gap-6 lg:grid-cols-12">
        <section className="rounded-3xl border border-line bg-surface p-8 lg:col-span-5" aria-labelledby="hours-title">
          <h2 id="hours-title" className="display flex items-center gap-3 text-4xl text-ink"><Clock className="size-6 text-brass" aria-hidden="true" /> Opening hours</h2>
          <HoursList hours={settings.hours} className="mt-5" />
          <p className="mt-4 text-xs text-muted">Individual stores may keep different hours. Check each store page.</p>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-8 lg:col-span-7" aria-labelledby="find-title">
          <h2 id="find-title" className="display flex items-center gap-3 text-4xl text-ink"><MapPin className="size-6 text-brass" aria-hidden="true" /> Getting here</h2>
          <address className="mt-5 text-lg not-italic text-ink">{settings.address}</address>
          <p className="mt-4 flex gap-3 text-sm leading-relaxed text-ink-2"><Bus className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />{settings.gettingHere}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button as="a" href={mapsUrl} target="_blank" rel="noopener noreferrer">Open in Maps</Button>
            <Button as="a" href={`tel:${settings.phone.replace(/\s/g, '')}`} variant="outline"><Phone className="size-4" aria-hidden="true" /> {settings.phone}</Button>
            <Button as="a" href={`mailto:${settings.email}`} variant="outline"><Mail className="size-4" aria-hidden="true" /> Email us</Button>
          </div>
        </section>

        <section id="parking" className="scroll-mt-28 rounded-3xl bg-ink p-8 text-paper lg:col-span-7" aria-labelledby="parking-title">
          <h2 id="parking-title" className="display flex items-center gap-3 text-4xl"><Car className="size-6 text-brass-fill" aria-hidden="true" /> Parking</h2>
          <dl className="mt-6 grid gap-6 sm:grid-cols-3">
            <div><dt className="text-xs text-paper/60">Capacity</dt><dd className="display text-4xl tabular">{settings.parking.capacity.toLocaleString('en-IN')}</dd></div>
            <div><dt className="text-xs text-paper/60">Levels</dt><dd className="mt-1 text-sm">{settings.parking.levels}</dd></div>
            <div><dt className="text-xs text-paper/60">EV charging</dt><dd className="mt-1 flex items-center gap-1.5 text-sm"><Zap className="size-4 text-brass-fill" aria-hidden="true" />{settings.parking.evCharging ? 'Available on B1' : 'Not available'}</dd></div>
          </dl>
          <p className="mt-6 text-paper/80">{settings.parking.rates}</p>
          {settings.parking.note && <p className="mt-2 text-sm text-paper/60">{settings.parking.note}</p>}
        </section>

        <section id="facilities" className="scroll-mt-28 rounded-3xl border border-line bg-surface p-8 lg:col-span-5" aria-labelledby="fac-title">
          <h2 id="fac-title" className="display text-4xl text-ink">Facilities</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 text-sm text-ink-2">
            {settings.facilities.map((f) => (
              <li key={f} className="flex items-center gap-2"><span className="size-1.5 rotate-45 bg-brass-fill" aria-hidden="true" />{f}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
