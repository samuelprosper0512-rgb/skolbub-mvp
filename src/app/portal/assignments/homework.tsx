'use client';

import { useEffect, useState } from 'react';

type Assignment = {
  id: string; subject: string; title: string; description: string; dueDate: string;
  submissions: { content: string; grade: string | null; submittedAt: string }[];
};

export default function Homework() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    const response = await fetch('/api/assignments');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load assignments.');
    setAssignments(data.assignments);
  }

  useEffect(() => {
    void load().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load assignments.'));
  }, []);

  async function submit(assignmentId: string) {
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submission`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: answers[assignmentId] ?? '' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit your answer.');
      setNotice('Your answer has been submitted.');
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit your answer.');
    }
  }

  return <section><p className="text-sm font-semibold text-[#1d765b]">Student portal</p><h1 className="mt-1 font-serif text-3xl font-semibold">Homework</h1>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-4 text-sm text-[#1d765b]">{notice}</p>}
    <div className="mt-6 space-y-4">{assignments.map((item) => <article key={item.id} className="rounded-xl border border-[#e1e8df] bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><div><p className="text-sm font-semibold text-[#1d765b]">{item.subject}</p><h2 className="mt-1 text-lg font-bold">{item.title}</h2></div><time className="text-sm text-[#64736d]">Due {new Date(item.dueDate).toLocaleString()}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#53645b]">{item.description}</p>{item.submissions[0] ? <p className="mt-4 rounded-lg bg-[#f5f7f1] p-3 text-sm">Submitted {new Date(item.submissions[0].submittedAt).toLocaleString()}{item.submissions[0].grade && ` · Grade: ${item.submissions[0].grade}`}</p> : <div className="mt-4"><label className="sr-only" htmlFor={`answer-${item.id}`}>Answer for {item.title}</label><textarea id={`answer-${item.id}`} rows={4} value={answers[item.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} className="w-full rounded-lg border border-[#d8e1d8] px-3 py-2" placeholder="Write your answer" /><button onClick={() => void submit(item.id)} className="mt-2 rounded-lg bg-[#1d765b] px-4 py-2 text-sm font-bold text-white">Submit answer</button></div>}</article>)}{assignments.length === 0 && <p className="rounded-xl border border-[#e1e8df] bg-white p-6 text-sm text-[#64736d]">No assignments are available for your class.</p>}</div>
  </section>;
}
