'use client';

import { useEffect, useState } from 'react';

type NotificationItem = { id: string; title: string; message: string; isRead: boolean; createdAt: string };

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  async function load() {
    const response = await fetch('/api/notifications');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load notifications.');
    setNotifications(data.notifications);
  }

  useEffect(() => { void load().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications.')); }, []);

  async function markRead(id?: string) {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id } : { readAll: true }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Unable to update notifications.'); return; }
    setNotifications((current) => current.map((item) => !id || item.id === id ? { ...item, isRead: true } : item));
  }

  return <div className="relative">
    <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="relative grid h-10 w-10 place-items-center rounded-full border border-[#e1e8df] bg-white text-[#53645b] hover:bg-[#f5f7f1]">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#b53f35] px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
    </button>
    {open && <section aria-label="Recent notifications" className="absolute right-0 top-12 z-30 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[#e1e8df] bg-white text-left shadow-xl">
      <div className="flex items-center justify-between border-b border-[#edf0e9] px-4 py-3"><h2 className="text-sm font-bold">Notifications</h2>{unreadCount > 0 && <button type="button" onClick={() => void markRead()} className="text-xs font-semibold text-[#1d765b]">Mark all read</button>}</div>
      {error && <p role="alert" className="px-4 py-3 text-xs text-red-700">{error}</p>}
      <ul className="max-h-96 divide-y divide-[#edf0e9] overflow-y-auto">{notifications.map((item) => <li key={item.id}><button type="button" onClick={() => !item.isRead && void markRead(item.id)} className={`block w-full px-4 py-3 text-left hover:bg-[#f8faf6] ${item.isRead ? '' : 'bg-[#f3f8f2]'}`}><span className="flex items-start justify-between gap-2 text-sm font-semibold">{item.title}{!item.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1d765b]" />}</span><span className="mt-1 block text-xs leading-5 text-[#64736d]">{item.message}</span><time className="mt-2 block text-[11px] text-[#87938c]">{new Date(item.createdAt).toLocaleString()}</time></button></li>)}</ul>
      {notifications.length === 0 && !error && <p className="px-4 py-6 text-center text-sm text-[#64736d]">You have no notifications.</p>}
    </section>}
  </div>;
}
