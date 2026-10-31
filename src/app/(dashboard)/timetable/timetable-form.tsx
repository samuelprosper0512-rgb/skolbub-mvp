'use client';
import { FormEvent, useEffect, useState } from 'react';

type Entry = { id: string; gradeLevel: string; dayOfWeek: string; period: string; subject: string; teacher: { name: string } | null };
type Staff = { id: string; name: string };
export default function TimetableForm() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function load() {
    const response = await fetch('/api/timetable');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to load timetable.');
    setEntries(result.entries); setStaff(result.staff); setGrades(result.grades);
  }
  useEffect(() => { load().catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unable to load timetable.')); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; setError(''); setSaving(true);
    try {
      const response = await fetch('/api/timetable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'Unable to save timetable.'); return; }
      form.reset(); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save timetable.'); }
    finally { setSaving(false); }
  }
  return <><form onSubmit={submit} className="mt-6 grid gap-3 rounded-xl border border-[#e1e8df] bg-white p-5 sm:grid-cols-3">
    <label className="text-sm font-semibold">Grade<select name="gradeLevel" required className="mt-1 w-full rounded border p-2.5">{grades.map((grade) => <option key={grade}>{grade}</option>)}</select></label>
    <label className="text-sm font-semibold">Day<select name="dayOfWeek" className="mt-1 w-full rounded border p-2.5">{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day) => <option key={day}>{day}</option>)}</select></label>
    <label className="text-sm font-semibold">Period<input name="period" required placeholder="Period 1" className="mt-1 w-full rounded border p-2.5" /></label>
    <label className="text-sm font-semibold">Subject<input name="subject" required className="mt-1 w-full rounded border p-2.5" /></label>
    <label className="text-sm font-semibold">Teacher<select name="teacherId" defaultValue="" className="mt-1 w-full rounded border p-2.5"><option value="">Unassigned</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
    <button disabled={saving || grades.length === 0} className="self-end rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save period'}</button>
    {error && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{error}</p>}
  </form><section className="mt-6 overflow-hidden rounded-xl border bg-white"><h2 className="px-5 py-4 font-bold">Timetable periods</h2>{entries.length ? <ul className="divide-y">{entries.map((entry) => <li key={entry.id} className="flex justify-between gap-4 px-5 py-4"><span>{entry.gradeLevel} · {entry.dayOfWeek} · {entry.period}: <b>{entry.subject}</b></span><span className="text-sm text-[#64736d]">{entry.teacher?.name || 'No teacher assigned'}</span></li>)}</ul> : <p className="p-5 text-sm text-[#64736d]">No timetable periods recorded yet.</p>}</section></>;
}
