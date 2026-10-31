'use client';

import { FormEvent, useEffect, useState } from 'react';

type Assignment = { id: string; subject: string; gradeLevel: string; title: string; description: string; dueDate: string };

export default function AssignmentsAdmin() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch('/api/assignments');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load assignments.');
    setAssignments(data.assignments);
  }

  useEffect(() => {
    void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load assignments.'));
  }, []);

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create assignment.');
      form.reset();
      setMessage('Assignment created.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create assignment.');
    } finally {
      setBusy(false);
    }
  }

  return <section><p className="text-sm font-semibold text-[#1d765b]">Teaching</p><h1 className="mt-1 font-serif text-3xl font-semibold">Assignments & homework</h1>
    <form onSubmit={createAssignment} className="mt-6 grid gap-4 rounded-xl border border-[#e1e8df] bg-white p-5 sm:grid-cols-2">
      <label className="text-sm font-semibold">Title<input required name="title" maxLength={150} className="mt-1 block w-full rounded-lg border border-[#d8e1d8] px-3 py-2" /></label>
      <label className="text-sm font-semibold">Subject<input required name="subject" className="mt-1 block w-full rounded-lg border border-[#d8e1d8] px-3 py-2" /></label>
      <label className="text-sm font-semibold">Grade level<input required name="gradeLevel" className="mt-1 block w-full rounded-lg border border-[#d8e1d8] px-3 py-2" /></label>
      <label className="text-sm font-semibold">Due date<input required name="dueDate" type="datetime-local" className="mt-1 block w-full rounded-lg border border-[#d8e1d8] px-3 py-2" /></label>
      <label className="text-sm font-semibold sm:col-span-2">Instructions<textarea required name="description" rows={4} maxLength={10000} className="mt-1 block w-full rounded-lg border border-[#d8e1d8] px-3 py-2" /></label>
      <div className="sm:col-span-2"><button disabled={busy} className="rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Create assignment'}</button>{message && <p role="status" className="mt-3 text-sm text-[#64736d]">{message}</p>}</div>
    </form>
    <div className="mt-6 divide-y divide-[#edf0e9] overflow-hidden rounded-xl border border-[#e1e8df] bg-white">{assignments.map((item) => <article key={item.id} className="p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">{item.title}</h2><time className="text-sm text-[#64736d]">{new Date(item.dueDate).toLocaleString()}</time></div><p className="mt-1 text-sm text-[#64736d]">{item.subject} · {item.gradeLevel}</p><p className="mt-3 whitespace-pre-wrap text-sm">{item.description}</p></article>)}{assignments.length === 0 && <p className="p-5 text-sm text-[#64736d]">No assignments created yet.</p>}</div>
  </section>;
}
