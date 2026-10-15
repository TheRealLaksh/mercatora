import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Wordmark } from '../ui/Logo.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { DAYS } from '../../lib/constants.js';
import { formatDayHours, todayKey } from '../../lib/hours.js';

export default function Footer() {
  const { settings } = useSettings();
  const { isStaff } = useAuth();
  const today = todayKey(new Date(), settings.timezone);
  const link = 'text-sm text-[color:var(--ink-2)] transition hover:text-ink';

  return (
    <footer className="mt-24 border-t border-line bg-sunken">
      <div className="container-x grid gap-12 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Wordmark />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-2">{settings.tagline}</p>
          <address className="mt-6 space-y-2.5 text-sm not-italic text-ink-2">
            <p className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden="true" />{settings.address}</p>
            <p className="flex gap-2.5"><Phone className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden="true" /><a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:text-ink">{settings.phone}</a></p>
            <p className="flex gap-2.5"><Mail className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden="true" /><a href={`mailto:${settings.email}`} className="hover:text-ink">{settings.email}</a></p>
          </address>
        </div>

        <nav aria-label="Explore" className="md:col-span-2">
          <h2 className="eyebrow mb-4">Explore</h2>
          <ul className="space-y-2.5">
            <li><Link className={link} to="/stores">All stores</Link></li>
            <li><Link className={link} to="/map">Floor map</Link></li>
            <li><Link className={link} to="/whats-on">Offers and events</Link></li>
            <li><Link className={link} to="/favorites">Favourites</Link></li>
            <li><Link className={link} to="/reservations">My reservations</Link></li>
          </ul>
        </nav>

        <nav aria-label="Visit" className="md:col-span-2">
          <h2 className="eyebrow mb-4">Visit</h2>
          <ul className="space-y-2.5">
            <li><Link className={link} to="/visit">Plan your visit</Link></li>
            <li><Link className={link} to="/visit#parking">Parking</Link></li>
            <li><Link className={link} to="/visit#facilities">Facilities</Link></li>
            <li><Link className={link} to={isStaff ? '/console' : '/login'}>{isStaff ? 'Console' : 'Store owner sign in'}</Link></li>
          </ul>
        </nav>

        <div className="md:col-span-4 lg:col-span-4">
          <h2 className="eyebrow mb-4 flex items-center gap-2"><Clock className="size-3.5" aria-hidden="true" /> Mall hours</h2>
          <dl className="space-y-1.5 text-sm">
            {DAYS.map((d) => (
              <div key={d.key} className={`flex justify-between gap-4 ${d.key === today ? 'font-semibold text-ink' : 'text-ink-2'}`}>
                <dt>{d.long}</dt>
                <dd className="tabular">{formatDayHours(settings.hours[d.key])}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {settings.name}. All rights reserved.</p>
          <p>Prices in Indian rupees. Reservations are paid for at the store.</p>
        </div>
      </div>
    </footer>
  );
}
