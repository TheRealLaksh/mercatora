import { missingConfig } from '../../lib/firebase.js';

export default function SetupNotice() {
  return (
    <main className="mx-auto grid min-h-screen max-w-2xl place-items-center px-6 py-16">
      <div>
        <p className="eyebrow">Almost there</p>
        <h1 className="display mt-3 text-6xl text-ink">Connect Firebase</h1>
        <p className="mt-4 text-ink-2">Mercatora needs a Firebase project to run. These values are missing from your environment:</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {missingConfig.map((k) => (<li key={k}><code className="rounded bg-sunken px-2 py-1 font-mono text-sm text-ink">{k}</code></li>))}
        </ul>
        <ol className="mt-8 list-decimal space-y-3 pl-5 text-ink-2">
          <li>Copy <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-sm">.env.example</code> to <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-sm">.env</code> and fill in your Firebase web app keys.</li>
          <li>Or run everything locally with no keys: <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-sm">npm run emulators</code>, then <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-sm">npm run seed</code>, then <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-sm">npm run dev:emu</code>.</li>
          <li>Restart the dev server after changing environment variables.</li>
        </ol>
      </div>
    </main>
  );
}
