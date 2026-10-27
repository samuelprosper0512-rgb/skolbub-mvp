'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Answers = {
  schoolType: string;
  ownership: string;
  hasComputerLabs: boolean;
  enableCBT: boolean;
  enableOnlineClasses: boolean;
  primaryColor: string;
};

const steps = ['School profile', 'Facilities & features', 'School branding'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    schoolType: 'secondary',
    ownership: 'private',
    hasComputerLabs: false,
    enableCBT: true,
    enableOnlineClasses: false,
    primaryColor: '#1e40af',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateAnswer<Key extends keyof Answers>(key: Key, value: Answers[Key]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to save your school setup.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">← Dashboard</Link>
      <p className="mt-6 text-sm font-semibold text-[#1d765b]">School setup</p>
      <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Make Skolhub yours</h1>
      <p className="mt-2 text-sm text-[#64736d]">Set up your school profile, features, and brand color.</p>

      <div className="mt-7 grid grid-cols-3 gap-2" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((label, index) => <div key={label} className={`h-1.5 rounded-full ${index <= step ? 'bg-[#1d765b]' : 'bg-[#dce4d8]'}`} />)}
      </div>
      <p className="mt-3 text-xs font-semibold text-[#64736d]">Step {step + 1} of {steps.length}: {steps[step]}</p>

      <form onSubmit={finish} className="mt-4 rounded-xl border border-[#e1e8df] bg-white p-5 sm:p-7">
        {step === 0 && <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold">School type
            <select value={answers.schoolType} onChange={(event) => updateAnswer('schoolType', event.target.value)} className="mt-2 w-full rounded-lg border border-[#d6ded5] bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15">
              <option value="primary">Primary</option><option value="secondary">Secondary</option><option value="higher">Higher</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Ownership
            <select value={answers.ownership} onChange={(event) => updateAnswer('ownership', event.target.value)} className="mt-2 w-full rounded-lg border border-[#d6ded5] bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15">
              <option value="public">Public</option><option value="private">Private</option>
            </select>
          </label>
        </div>}

        {step === 1 && <fieldset className="space-y-4">
          <legend className="mb-4 text-sm font-semibold">Choose the facilities and features your school uses.</legend>
          <Toggle label="Do you have computer labs?" checked={answers.hasComputerLabs} onChange={(checked) => updateAnswer('hasComputerLabs', checked)} />
          <Toggle label="Enable CBT?" checked={answers.enableCBT} onChange={(checked) => updateAnswer('enableCBT', checked)} />
          <Toggle label="Enable Online Classes?" checked={answers.enableOnlineClasses} onChange={(checked) => updateAnswer('enableOnlineClasses', checked)} />
        </fieldset>}

        {step === 2 && <div>
          <label htmlFor="primaryColor" className="block text-sm font-semibold">Primary brand color</label>
          <p className="mt-1 text-sm text-[#64736d]">This color accents your school administration workspace.</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <input id="primaryColor" type="color" value={answers.primaryColor} onChange={(event) => updateAnswer('primaryColor', event.target.value)} className="h-14 w-16 cursor-pointer rounded-lg border border-[#d6ded5] bg-white p-1" />
            <span className="font-mono text-sm uppercase text-[#53645b]">{answers.primaryColor}</span>
            <span style={{ backgroundColor: answers.primaryColor }} className="rounded-lg px-4 py-2.5 text-sm font-bold text-white">Brand preview</span>
          </div>
        </div>}

        {error && <p role="alert" className="mt-5 rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d]">{error}</p>}
        <div className="mt-8 flex items-center justify-between border-t border-[#edf0e9] pt-5">
          <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || submitting} className="rounded-lg border border-[#cbd6cc] px-4 py-2.5 text-sm font-bold text-[#29443a] transition hover:bg-[#f5f7f1] disabled:cursor-not-allowed disabled:opacity-40">Back</button>
          {step < steps.length - 1 ? <button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} className="rounded-lg bg-[#1d765b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48]">Continue</button> : <button type="submit" disabled={submitting} className="rounded-lg bg-[#1d765b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Saving…' : 'Finish'}</button>}
        </div>
      </form>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[#e1e8df] px-4 py-3.5 text-sm font-medium"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#1d765b]" /></label>;
}