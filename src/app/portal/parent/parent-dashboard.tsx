'use client';

import { useEffect, useState } from 'react';

type Child = {
  id: string;
  name: string;
  studentNumber: string;
  gradeLevel: string;
  results: { subject: string; term: string; totalScore: number; grade: string }[];
  fees: { id: string; title: string; amount: number; status: string }[];
  attendance: { date: string; status: string }[];
};

export default function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChildren() {
      try {
        const response = await fetch('/api/parent/children');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load your children.');
        setChildren(data.children);
        setSelectedId(data.children[0]?.id ?? '');
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your children.');
      } finally {
        setLoading(false);
      }
    }

    void loadChildren();
  }, []);

  const child = children.find((item) => item.id === selectedId);

  return (
    <section>
      <p className="text-sm font-semibold text-[#1d765b]">Parent portal</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-serif text-3xl font-semibold tracking-tight">Family dashboard</h1><p className="mt-2 text-sm text-[#64736d]">View your children’s school information.</p></div>
        {children.length > 0 && <label className="text-sm font-semibold">Child<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1 block min-w-56 rounded-lg border border-[#d8e1d8] bg-white px-3 py-2"><option value="">Select a child</option>{children.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      </div>
      {loading ? <p className="mt-8 text-sm text-[#64736d]">Loading your children…</p> : error ? <p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p> : !child ? <p className="mt-8 rounded-xl border border-[#e1e8df] bg-white p-6 text-sm text-[#64736d]">No students are linked to your parent account yet.</p> : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-[#e1e8df] bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[#87938c]">Student</p><p className="mt-2 font-bold">{child.name}</p><p className="mt-1 text-sm text-[#64736d]">{child.studentNumber} · {child.gradeLevel}</p></article>
            <article className="rounded-xl border border-[#e1e8df] bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[#87938c]">Unpaid fees</p><p className="mt-2 text-2xl font-bold">{child.fees.filter((fee) => fee.status.toLowerCase() !== 'paid').length}</p><p className="mt-1 text-sm text-[#64736d]">{child.fees.filter((fee) => fee.status.toLowerCase() !== 'paid').reduce((total, fee) => total + fee.amount, 0).toLocaleString()}</p></article>
            <article className="rounded-xl border border-[#e1e8df] bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[#87938c]">Attendance records</p><p className="mt-2 text-2xl font-bold">{child.attendance.length}</p><p className="mt-1 text-sm text-[#64736d]">Most recent 30 days</p></article>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-[#e1e8df] bg-white"><h2 className="border-b border-[#edf0e9] px-5 py-4 font-bold">Results</h2>{child.results.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-[#87938c]"><tr><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Term</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Grade</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{child.results.map((result, index) => <tr key={`${result.term}-${result.subject}-${index}`}><td className="px-5 py-3">{result.subject}</td><td className="px-5 py-3">{result.term}</td><td className="px-5 py-3">{result.totalScore}</td><td className="px-5 py-3">{result.grade}</td></tr>)}</tbody></table></div> : <p className="px-5 py-6 text-sm text-[#64736d]">No results are available.</p>}</section>
            <section className="rounded-xl border border-[#e1e8df] bg-white"><h2 className="border-b border-[#edf0e9] px-5 py-4 font-bold">Fees and attendance</h2><div className="divide-y divide-[#edf0e9]">{child.fees.length ? child.fees.map((fee) => <div key={fee.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><span>{fee.title}</span><span className="text-right font-semibold">{fee.amount.toLocaleString()} · {fee.status}</span></div>) : <p className="px-5 py-4 text-sm text-[#64736d]">No fee records.</p>}{child.attendance.length ? child.attendance.slice(0, 5).map((record, index) => <div key={`${record.date}-${index}`} className="flex items-center justify-between px-5 py-3 text-sm"><time>{new Date(record.date).toLocaleDateString()}</time><span className="font-semibold">{record.status}</span></div>) : <p className="px-5 py-4 text-sm text-[#64736d]">No attendance records.</p>}</div></section>
          </div>
        </>
      )}
    </section>
  );
}
