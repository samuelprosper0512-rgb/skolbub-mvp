'use client';

import { FormEvent, useEffect, useState } from 'react';

type Contact = { id: string; name: string; email: string; role: string };
type Message = {
  id: string; senderId: string; receiverId: string; content: string; createdAt: string;
  sender: { id: string; name: string }; receiver: { id: string; name: string };
};

export default function InboxClient({ currentUserId }: { currentUserId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function load() {
    const response = await fetch('/api/messages');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to load messages.');
    setContacts(result.contacts);
    setMessages(result.messages);
  }

  useEffect(() => {
    load().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load messages.')).finally(() => setLoading(false));
  }, []);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSending(true);
    const form = event.currentTarget;
    try {
      const response = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to send message.');
        return;
      }
      form.reset();
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-7 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={send} className="h-fit rounded-xl border border-[#e1e8df] bg-white p-5">
        <h2 className="font-bold">Compose message</h2>
        <label className="mt-4 block text-sm font-semibold">Recipient<select name="receiverId" required defaultValue="" className="mt-1.5 w-full rounded-lg border border-[#d6ded5] bg-white px-3 py-3 text-sm"><option value="" disabled>Select a recipient</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.role}</option>)}</select></label>
        <label className="mt-4 block text-sm font-semibold">Message<textarea name="content" required maxLength={5000} rows={5} className="mt-1.5 w-full rounded-lg border border-[#d6ded5] px-3 py-3 text-sm" /></label>
        {error && <p role="alert" className="mt-3 text-sm text-[#a6402d]">{error}</p>}
        <button disabled={sending || contacts.length === 0} className="mt-4 rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{sending ? 'Sending…' : 'Send message'}</button>
      </form>
      <section className="overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        <h2 className="border-b border-[#edf0e9] px-5 py-4 font-bold">Inbox and sent messages</h2>
        {loading ? <p className="p-6 text-sm text-[#64736d]">Loading messages…</p> : messages.length === 0 ? <p className="p-6 text-sm text-[#64736d]">No messages yet.</p> : <ul className="divide-y divide-[#edf0e9]">{messages.map((message) => <li key={message.id} className="px-5 py-4"><div className="flex justify-between gap-3 text-xs text-[#87938c]"><span>{message.senderId === currentUserId ? `To ${message.receiver.name}` : `From ${message.sender.name}`}</span><time>{new Date(message.createdAt).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p></li>)}</ul>}
      </section>
    </div>
  );
}
