import { useEffect, useState } from 'react';
import { PageHeader, Panel } from '../../components/console/ui.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Textarea } from '../../components/ui/Field.jsx';
import HoursEditor from '../../components/ui/HoursEditor.jsx';
import { Skeleton } from '../../components/ui/Feedback.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { saveSettings } from '../../services/settings.js';
import { hasErrors, validateSettings } from '../../lib/schemas.js';

export default function Settings() {
  useDocumentTitle('Mall settings');
  const { settings, loading } = useSettings();
  const toast = useToast();
  const [f, setF] = useState(null);
  const [facilities, setFacilities] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !f) {
      setF(settings);
      setFacilities(settings.facilities.join(', '));
    }
  }, [loading, settings, f]);

  if (!f) return <Skeleton className="h-96 rounded-2xl" />;

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setParking = (k) => (e) => setF((s) => ({ ...s, parking: { ...s.parking, [k]: k === 'capacity' ? Number(e.target.value) : e.target.value } }));

  async function submit(e) {
    e.preventDefault();
    const data = { ...f, facilities: facilities.split(',').map((x) => x.trim()).filter(Boolean) };
    const errs = validateSettings(data);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    try {
      await saveSettings(data);
      toast.success('Mall settings saved.');
    } catch (err) {
      console.error(err);
      toast.error(err.code === 'permission-denied' ? 'Only administrators can change mall settings.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader eyebrow="Configuration" title="Mall settings" description="These details appear in the footer, on the Plan your visit page and in the open now indicator." actions={<Button type="submit" loading={busy}>Save settings</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Identity and contact">
          <div className="space-y-4">
            <Input label="Mall name" value={f.name} onChange={set('name')} error={errors.name} required />
            <Input label="Tagline" value={f.tagline} onChange={set('tagline')} />
            <Textarea label="Address" rows={2} value={f.address} onChange={set('address')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="City" value={f.city} onChange={set('city')} />
              <Input label="Time zone" value={f.timezone} onChange={set('timezone')} hint="IANA name, for example Asia/Kolkata." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Phone" type="tel" value={f.phone} onChange={set('phone')} error={errors.phone} />
              <Input label="Email" type="email" value={f.email} onChange={set('email')} error={errors.email} />
            </div>
            <Textarea label="Getting here" rows={3} value={f.gettingHere} onChange={set('gettingHere')} />
          </div>
        </Panel>
        <Panel title="Mall hours">
          <HoursEditor value={f.hours} onChange={(hours) => setF((s) => ({ ...s, hours }))} error={errors.hours} />
        </Panel>
        <Panel title="Parking" className="lg:col-span-1">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Capacity (bays)" type="number" min="0" value={f.parking.capacity} onChange={setParking('capacity')} />
              <Input label="Levels" value={f.parking.levels} onChange={setParking('levels')} />
            </div>
            <Input label="Rates" value={f.parking.rates} onChange={setParking('rates')} />
            <Input label="Note" value={f.parking.note ?? ''} onChange={setParking('note')} />
          </div>
        </Panel>
        <Panel title="Facilities">
          <Textarea label="Facilities" rows={4} value={facilities} onChange={(e) => setFacilities(e.target.value)} hint="Comma separated." />
        </Panel>
      </div>
    </form>
  );
}
