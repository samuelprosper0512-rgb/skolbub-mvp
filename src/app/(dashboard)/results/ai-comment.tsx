'use client';

import { useState } from 'react';

type Grade = { subject: string; score: number; grade: string };

export default function AIComment({ studentId, grades }: { studentId: string; grades: Grade[] }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/ai/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, grades }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to generate a report comment.');
        return;
      }
      setComment(result.comment);
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-[#e1e8df] bg-white p-5">
      <button type="button" disabled={loading || grades.length === 0} onClick={() => void generate()} className="rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Generating…' : 'Generate AI Comment'}</button>
      {error && <p role="alert" className="mt-3 text-sm text-[#a6402d]">{error}</p>}
      {comment && <p className="mt-4 rounded-lg bg-[#f5f7f1] p-4 text-sm leading-6 text-[#29443a]">{comment}</p>}
      {grades.length === 0 && <p className="mt-3 text-xs text-[#87938c]">Add result records to generate a comment.</p>}
    </section>
  );
}
