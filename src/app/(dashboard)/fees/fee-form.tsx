'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type StudentOption = { id: string; name: string; studentNumber: string };

export default function FeeForm({ students }: { students: StudentOption[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const form = event.currentTarget;
      const response = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to assign this fee.');
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
    <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-[#e1e8df] bg-white p-5 sm:p-6">
      <h2 className="text-base font-bold">Assign a fee</h2>
      {students.length === 0 ? <p className="mt-3 text-sm text-[#64736d]">Add a student before assigning a fee.</p> : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div><label htmlFor="studentId" className="mb-1.5 block text-sm font-semibold">Student</label><select id="studentId" name="studentId" required defaultValue="" className="w-full rounded-lg border border-[#d6ded5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15"><option value="" disabled>Select a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.studentNumber})</option>)}</select></div>
            <Field label="Fee title" name="title" placeholder="Term 1 Tuition" />
            <Field label="Amount (naira)" name="amount" type="number" placeholder="50000" min={1} />
          </div>
          {error && <p role="alert" className="mt-4 rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d]">{error}</p>}
          <button type="submit" disabled={submitting} className="mt-4 rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Assigning fee…' : 'Assign fee'}</button>
        </>
      )}
    </form>
  );
}

function Field({ label, name, type = 'text', placeholder, min }: { label: string; name: string; type?: string; placeholder: string; min?: number }) {
  return <div><label htmlFor={name} className="mb-1.5 block text-sm font-semibold">{label}</label><input id={name} name={name} type={type} required maxLength={120} min={min} placeholder={placeholder} className="w-full rounded-lg border border-[#d6ded5] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#a0aaa2] focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15" /></div>;
}