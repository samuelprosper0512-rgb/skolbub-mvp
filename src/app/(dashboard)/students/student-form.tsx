'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const form = event.currentTarget;
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to add this student.');
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
      <h2 className="text-base font-bold">Add a student</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Student name" name="name" placeholder="Amara Okafor" />
        <Field label="Student number" name="studentNumber" placeholder="STU-001" />
        <Field label="Grade level" name="gradeLevel" placeholder="JSS 1" />
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d]">{error}</p>}
      <button type="submit" disabled={submitting} className="mt-4 rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Adding student…' : 'Add student'}</button>
    </form>
  );
}

function Field({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">{label}</label>
      <input id={name} name={name} required maxLength={100} placeholder={placeholder} className="w-full rounded-lg border border-[#d6ded5] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#a0aaa2] focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15" />
    </div>
  );
}