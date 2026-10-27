'use client';

import { useState } from 'react';

type AttendanceStudent = {
  id: string;
  name: string;
  studentNumber: string;
  gradeLevel: string;
  status: string | null;
};

const STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
] as const;

export default function AttendanceForm({ date, students }: { date: string; students: AttendanceStudent[] }) {
  const [statuses, setStatuses] = useState<Record<string, string>>(
    () => Object.fromEntries(students.flatMap((student) => student.status ? [[student.id, student.status]] : [])),
  );
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveAttendance() {
    setError('');
    setSavedMessage('');
    const attendance = Object.entries(statuses).map(([studentId, status]) => ({ studentId, status }));
    if (attendance.length === 0) {
      setError('Select a status for at least one student before saving.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, attendance }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to save attendance.');
        return;
      }
      setSavedMessage(`Attendance saved for ${result.savedCount} ${result.savedCount === 1 ? 'student' : 'students'}.`);
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d]">{error}</p>}
      {savedMessage && <p role="status" className="mb-4 rounded-lg bg-[#edf6ee] px-3.5 py-3 text-sm text-[#1d765b]">{savedMessage}</p>}
      {students.length === 0 ? <p className="px-5 py-12 text-center text-sm text-[#64736d]">Add students before marking attendance.</p> : (
        <>
          <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#718078]"><tr><th className="px-5 py-3.5 font-semibold">Student</th><th className="px-5 py-3.5 font-semibold">Student number</th><th className="px-5 py-3.5 font-semibold">Grade</th><th className="px-5 py-3.5 font-semibold">Attendance</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{students.map((student) => <tr key={student.id}><td className="px-5 py-4 font-semibold">{student.name}</td><td className="px-5 py-4 text-[#64736d]">{student.studentNumber}</td><td className="px-5 py-4 text-[#64736d]">{student.gradeLevel}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-3">{STATUSES.map((status) => <label key={status.value} className="flex items-center gap-1.5 text-sm"><input type="radio" name={`attendance-${student.id}`} value={status.value} checked={statuses[student.id] === status.value} onChange={() => setStatuses((current) => ({ ...current, [student.id]: status.value }))} className="accent-[#1d765b]" />{status.label}</label>)}</div></td></tr>)}</tbody></table></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0e9] px-5 py-4"><p className="text-xs text-[#87938c]">Unselected students will not be changed.</p><button type="button" disabled={saving || Object.keys(statuses).length === 0} onClick={() => void saveAttendance()} className="rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : 'Save Attendance'}</button></div>
        </>
      )}
    </>
  );
}
