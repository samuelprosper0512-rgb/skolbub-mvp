'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type StudentOption = { id: string; name: string; studentNumber: string };

export default function ResultsForm({ students, selectedStudentId }: { students: StudentOption[]; selectedStudentId: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function selectStudent(studentId: string) {
    router.push(`/results?studentId=${encodeURIComponent(studentId)}`);
  }

  async function submitResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const form = event.currentTarget;
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), studentId: selectedStudentId }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Unable to save this result.');
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-[#e1e8df] bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <div><label htmlFor="studentId" className="mb-1.5 block text-sm font-semibold">Student</label><select id="studentId" value={selectedStudentId} onChange={(event) => selectStudent(event.target.value)} className="w-full rounded-lg border border-[#d6ded5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15">{students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.studentNumber})</option>)}</select></div>
        <form onSubmit={submitResult} className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject" name="subject" placeholder="Mathematics" />
          <Field label="Term" name="term" placeholder="Term 1" />
          <Field label="CA score" name="caScore" type="number" min={0} max={100} placeholder="30" />
          <Field label="Exam score" name="examScore" type="number" min={0} max={100} placeholder="60" />
          {error && <p role="alert" className="rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d] sm:col-span-2">{error}</p>}
          <button type="submit" disabled={submitting} className="rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">{submitting ? 'Saving result…' : 'Save result'}</button>
        </form>
      </div>
    </section>
  );
}

function Field({ label, name, type = 'text', min, max, placeholder }: { label: string; name: string; type?: string; min?: number; max?: number; placeholder: string }) {
  return <div><label htmlFor={name} className="mb-1.5 block text-sm font-semibold">{label}</label><input id={name} name={name} type={type} required maxLength={100} min={min} max={max} placeholder={placeholder} className="w-full rounded-lg border border-[#d6ded5] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#a0aaa2] focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15" /></div>;
}