'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AnnouncementForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const form = event.currentTarget;

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to create this announcement.');
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-[#e1e8df] bg-white p-5 sm:p-6">
      <h2 className="text-base font-bold">Create an announcement</h2>
      <div className="mt-4 space-y-4">
        <div><label htmlFor="announcement-title" className="mb-1.5 block text-sm font-semibold">Title</label><input id="announcement-title" name="title" required maxLength={150} className="w-full rounded-lg border border-[#d6ded5] px-3.5 py-3 text-sm outline-none focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15" /></div>
        <div><label htmlFor="announcement-content" className="mb-1.5 block text-sm font-semibold">Content</label><textarea id="announcement-content" name="content" required maxLength={10000} rows={5} className="w-full resize-y rounded-lg border border-[#d6ded5] px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15" /></div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d]">{error}</p>}
      <button type="submit" disabled={saving} className="mt-4 rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Publishing…' : 'Publish announcement'}</button>
    </form>
  );
}
