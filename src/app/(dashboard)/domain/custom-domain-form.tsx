'use client';

import { FormEvent, useState } from 'react';

export default function CustomDomainForm({ initialDomain, schoolSlug }: { initialDomain: string; schoolSlug: string }) {
  const [domain, setDomain] = useState(initialDomain);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/tenant/domain', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customDomain: domain }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update the domain.');
      setDomain(data.customDomain ?? '');
      setMessage(data.customDomain ? 'Custom domain saved.' : 'Custom domain removed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update the domain.');
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={save} className="mt-6 max-w-2xl rounded-xl border border-[#e1e8df] bg-white p-5 sm:p-6">
    <p className="text-sm text-[#64736d]">Your default portal is <span className="font-semibold">{schoolSlug}.skolhub.com</span>.</p>
    <label className="mt-5 block text-sm font-semibold">Custom hostname<input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="portal.example.com" className="mt-1 block w-full rounded-lg border border-[#d8e1d8] px-3 py-2" /></label>
    <p className="mt-2 text-xs leading-5 text-[#87938c]">Enter a hostname only, without https:// or a path. Point its DNS record to your Skolhub deployment before using it.</p>
    <button disabled={busy} className="mt-5 rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save domain'}</button>
    {message && <p role="status" className="mt-3 text-sm text-[#64736d]">{message}</p>}
  </form>;
}
