'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Question = {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type Exam = {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  duration: number;
  questions: Question[];
};

const OPTIONS = ['A', 'B', 'C', 'D'] as const;
type Answer = (typeof OPTIONS)[number];

export default function ExamTaking({ exam }: { exam: Exam }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(exam.duration * 60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState<{ score: number; totalQuestions: number } | null>(null);
  const answersRef = useRef(answers);
  const submittedRef = useRef(false);

  const submitExam = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/cbt/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: exam.id, answers: answersRef.current }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to submit your exam.');
        submittedRef.current = false;
        return;
      }
      setScore({ score: result.score, totalQuestions: result.totalQuestions });
    } catch {
      setError('A network error occurred while submitting your exam. Please try again.');
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [exam.id]);

  useEffect(() => {
    const deadline = Date.now() + exam.duration * 60 * 1000;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        void submitExam();
      }
    };

    const timer = window.setInterval(updateTimer, 1000);
    updateTimer();
    return () => window.clearInterval(timer);
  }, [exam.duration, submitExam]);

  function chooseAnswer(questionId: string, answer: Answer) {
    const nextAnswers = { ...answersRef.current, [questionId]: answer };
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
  }

  const question = exam.questions[currentQuestion];
  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  if (score) {
    return (
      <section className="mt-7 max-w-2xl rounded-xl border border-[#e1e8df] bg-white p-6 sm:p-8">
        <p className="text-sm font-semibold text-[#1d765b]">{exam.subject} · {exam.gradeLevel}</p>
        <h1 className="mt-2 font-serif text-2xl font-semibold">Exam submitted</h1>
        <p className="mt-4 text-lg font-bold">Your score: {score.score} / {score.totalQuestions}</p>
        <Link href="/portal/cbt" className="mt-6 inline-block rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48]">Back to exams</Link>
      </section>
    );
  }

  return (
    <section className="mt-7 max-w-3xl rounded-xl border border-[#e1e8df] bg-white p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e1e8df] pb-5">
        <div>
          <p className="text-sm font-semibold text-[#1d765b]">{exam.subject} · {exam.gradeLevel}</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold">{exam.title}</h1>
          <p className="mt-1 text-sm text-[#64736d]">Question {currentQuestion + 1} of {exam.questions.length}</p>
        </div>
        <div className="rounded-lg bg-[#f3f6f0] px-4 py-3">
          <p className="text-xs font-semibold text-[#53645b]">Time remaining</p>
          <p aria-live="off" className="font-mono text-2xl font-bold tabular-nums text-[#172521]">{formattedTime}</p>
        </div>
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d]">{error}</p>}

      <fieldset className="mt-6" disabled={submitting || secondsLeft === 0}>
        <legend className="text-lg font-semibold leading-7">{question.questionText}</legend>
        <div className="mt-5 space-y-3">
          {OPTIONS.map((option) => (
            <label key={option} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e1e8df] px-4 py-3 hover:bg-[#f8faf6]">
              <input
                type="radio"
                name={`answer-${question.id}`}
                value={option}
                checked={answers[question.id] === option}
                onChange={() => chooseAnswer(question.id, option)}
                className="mt-1 accent-[#1d765b]"
              />
              <span><strong>{option}.</strong> {question[`option${option}` as keyof Question]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={currentQuestion === 0 || submitting} onClick={() => setCurrentQuestion((index) => index - 1)} className="rounded-lg border border-[#cbd6cc] px-4 py-2.5 text-sm font-bold text-[#29443a] transition hover:bg-[#f5f7f1] disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
        {currentQuestion < exam.questions.length - 1 && secondsLeft > 0 ? (
          <button type="button" disabled={submitting} onClick={() => setCurrentQuestion((index) => index + 1)} className="rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">Next</button>
        ) : (
          <button type="button" disabled={submitting} onClick={() => void submitExam()} className="rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Submitting…' : secondsLeft === 0 && error ? 'Retry Submission' : 'Submit Exam'}</button>
        )}
      </div>
    </section>
  );
}
