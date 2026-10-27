'use client';

import { useEffect, useState } from 'react';

type Exam = {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  duration: number;
};

export default function CBTExamList({ exams }: { exams: Exam[] }) {
  const [gradeLevel, setGradeLevel] = useState('');
  const [startedExam, setStartedExam] = useState<Exam | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const gradeLevels = Array.from(new Set(exams.map((exam) => exam.gradeLevel)));
  const availableExams = exams.filter((exam) => exam.gradeLevel === gradeLevel);

  useEffect(() => {
    if (endTime === null) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) window.clearInterval(timer);
    };

    const timer = window.setInterval(updateTimer, 1000);
    updateTimer();
    return () => window.clearInterval(timer);
  }, [endTime]);

  function startExam(exam: Exam) {
    setStartedExam(exam);
    setSecondsLeft(exam.duration * 60);
    setEndTime(Date.now() + exam.duration * 60 * 1000);
  }

  function returnToExams() {
    setStartedExam(null);
    setEndTime(null);
    setSecondsLeft(0);
  }

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  if (startedExam) {
    return (
      <section className="mt-7 max-w-2xl rounded-xl border border-[#e1e8df] bg-white p-6 sm:p-8">
        <p className="text-sm font-semibold text-[#1d765b]">{startedExam.subject} · {startedExam.gradeLevel}</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold">Exam started</h2>
        <p className="mt-2 text-sm text-[#64736d]">{startedExam.title}</p>
        <div className="mt-7 flex items-center justify-between rounded-lg bg-[#f3f6f0] px-4 py-4">
          <span className="text-sm font-semibold text-[#53645b]">Time remaining</span>
          <span aria-live="off" className="font-mono text-2xl font-bold tabular-nums text-[#172521]">{formattedTime}</span>
        </div>
        {secondsLeft === 0 && <p role="status" className="mt-4 text-sm font-semibold text-[#a6402d]">Time is up.</p>}
        <p className="mt-4 text-sm leading-6 text-[#64736d]">Your exam timer is running. Questions and answer submission will be available in a later phase.</p>
        <button type="button" onClick={returnToExams} className="mt-6 rounded-lg border border-[#cbd6cc] px-4 py-2.5 text-sm font-bold text-[#29443a] transition hover:bg-[#f5f7f1]">Back to exams</button>
      </section>
    );
  }

  return (
    <section className="mt-7">
      <div className="max-w-sm">
        <label htmlFor="gradeLevel" className="mb-1.5 block text-sm font-semibold">Your grade level</label>
        <select id="gradeLevel" value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} className="w-full rounded-lg border border-[#d6ded5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15">
          <option value="">Select your grade level</option>
          {gradeLevels.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
        </select>
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        {!gradeLevel ? (
          <p className="px-5 py-10 text-center text-sm text-[#64736d]">Choose your grade level to see available exams.</p>
        ) : availableExams.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#64736d]">There are no exams available for {gradeLevel} right now.</p>
        ) : (
          <ul className="divide-y divide-[#edf0e9]">
            {availableExams.map((exam) => (
              <li key={exam.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
                <div><p className="font-semibold">{exam.title}</p><p className="mt-1 text-sm text-[#64736d]">{exam.subject} · {exam.duration} minutes</p></div>
                <button type="button" onClick={() => startExam(exam)} className="rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48]">Take Exam</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}