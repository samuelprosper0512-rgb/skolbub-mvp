'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Answers = {
  schoolName: string;
  slug: string;
  motto: string;
  schoolType: string;
  ownership: string;
  gradingSystem: string;
  hasComputerLabs: boolean;
  enableCBT: boolean;
  enableOnlineClasses: boolean;
  enableLibrary: boolean;
  enableTransport: boolean;
  currency: string;
  paymentCycle: string;
  primaryColor: string;
  logoUrl: string;
};
const steps = ['Identity', 'Academics', 'Facilities', 'Fees', 'Branding', 'School URL'];
const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'skolhub.com';
type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    schoolName: '', slug: '', motto: '', schoolType: 'secondary', ownership: 'private', gradingSystem: 'percentage',
    hasComputerLabs: false, enableCBT: true, enableOnlineClasses: false, enableLibrary: false, enableTransport: false,
    currency: 'NGN', paymentCycle: 'term', primaryColor: '#1e40af', logoUrl: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  function update<Key extends keyof Answers>(key: Key, value: Answers[Key]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    if (key === 'slug') setSlugStatus('idle');
  }

  async function checkSlugAvailability(slug: string) {
    setSlugStatus('checking');
    try {
      const response = await fetch(`/api/onboarding?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to check this school URL.');
      const available = result.available === true;
      setSlugStatus(available ? 'available' : 'taken');
      setError(available ? '' : 'That school URL is already in use. Choose another one.');
      return available;
    } catch (checkError) {
      setSlugStatus('error');
      setError(checkError instanceof Error ? checkError.message : 'Unable to check this school URL.');
      return false;
    }
  }

  useEffect(() => {
    let active = true;
    fetch('/api/onboarding')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load school profile.');
        if (active) setAnswers((current) => ({ ...current, ...result.tenant }));
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load school profile.');
      })
      .finally(() => { if (active) setLoadingProfile(false); });
    return () => { active = false; };
  }, []);

  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try {
      if (!/^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$/.test(answers.slug)) {
        setError('Choose a school URL using 3–50 lowercase letters, numbers, or hyphens.');
        return;
      }
      if (!await checkSlugAvailability(answers.slug)) return;
      const response = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(answers) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'Unable to save school setup.'); return; }
      router.push('/dashboard'); router.refresh();
    } catch { setError('A network error occurred. Please try again.'); }
    finally { setSubmitting(false); }
  }

  return <div className="max-w-3xl">
    <Link href="/dashboard" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">← Dashboard</Link>
    <p className="mt-6 text-sm font-semibold text-[#1d765b]">School setup</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Make Skolhub yours</h1>
    <p className="mt-2 text-sm text-[#64736d]">Configure your school identity, academics, facilities, fees, and brand.</p>
    <div className="mt-7 grid grid-cols-6 gap-2" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((label, index) => <div key={label} title={label} className={`h-1.5 rounded-full ${index <= step ? 'bg-[#1d765b]' : 'bg-[#dce4d8]'}`} />)}</div>
    <p className="mt-3 text-xs font-semibold text-[#64736d]">Step {step + 1} of {steps.length}: {steps[step]}</p>
    <form onSubmit={finish} className="mt-4 rounded-xl border border-[#e1e8df] bg-white p-5 sm:p-7">
      {step === 0 && <div className="grid gap-5">
        <Field label="School name" value={answers.schoolName} onChange={(v) => update('schoolName', v)} maxLength={120} />
        <Field label="School motto" value={answers.motto} onChange={(v) => update('motto', v)} maxLength={200} />
      </div>}
      {step === 1 && <div className="grid gap-5 sm:grid-cols-2">
        <Select label="School type" value={answers.schoolType} onChange={(v) => update('schoolType', v)} options={[['primary','Primary'],['secondary','Secondary'],['higher','Higher']]} />
        <Select label="Ownership" value={answers.ownership} onChange={(v) => update('ownership', v)} options={[['public','Public'],['private','Private']]} />
        <Select label="Grading system" value={answers.gradingSystem} onChange={(v) => update('gradingSystem', v)} options={[['percentage','Percentage'],['letter','Letter grades'],['four_point','4-point scale']]} />
      </div>}
      {step === 2 && <fieldset className="space-y-3"><legend className="mb-4 text-sm font-semibold">Enable the facilities and modules your school uses.</legend>
        <Toggle label="Computer labs" checked={answers.hasComputerLabs} onChange={(v) => update('hasComputerLabs', v)} />
        <Toggle label="CBT exams" checked={answers.enableCBT} onChange={(v) => update('enableCBT', v)} />
        <Toggle label="Online classes" checked={answers.enableOnlineClasses} onChange={(v) => update('enableOnlineClasses', v)} />
        <Toggle label="Library module" checked={answers.enableLibrary} onChange={(v) => update('enableLibrary', v)} />
        <Toggle label="Transport module" checked={answers.enableTransport} onChange={(v) => update('enableTransport', v)} />
      </fieldset>}
      {step === 3 && <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Currency" value={answers.currency} onChange={(v) => update('currency', v)} options={[['NGN','NGN — Naira'],['USD','USD — US Dollar'],['GBP','GBP — Pound'],['GHS','GHS — Cedi'],['KES','KES — Shilling'],['ZAR','ZAR — Rand']]} />
        <Select label="Payment cycle" value={answers.paymentCycle} onChange={(v) => update('paymentCycle', v)} options={[['term','Termly'],['semester','Semester'],['monthly','Monthly'],['annual','Annual']]} />
      </div>}
      {step === 4 && <div className="space-y-5">
        <label className="block text-sm font-semibold">Primary brand color<div className="mt-2 flex items-center gap-4"><input type="color" value={answers.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className="h-14 w-16 cursor-pointer rounded border p-1" /><span className="font-mono">{answers.primaryColor}</span></div></label>
        <Field label="Logo URL (HTTPS)" value={answers.logoUrl} onChange={(v) => update('logoUrl', v)} maxLength={2048} />
      </div>}
      {step === 5 && <div className="space-y-4">
        <p className="text-sm leading-6 text-[#64736d]">Choose the address your school community will use to access the portal.</p>
        <label className="block text-sm font-semibold" htmlFor="school-slug">School URL</label>
        <div className="flex overflow-hidden rounded-lg border border-[#d6ded5] bg-white focus-within:border-[#1d765b] focus-within:ring-2 focus-within:ring-[#1d765b]/15">
          <input id="school-slug" value={answers.slug} onChange={(event) => update('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 50))} required minLength={3} maxLength={50} pattern="[a-z0-9][a-z0-9-]{1,48}[a-z0-9]" className="min-w-0 flex-1 px-3.5 py-3 text-sm outline-none" aria-describedby="school-url-preview slug-status" />
          <span className="flex items-center border-l border-[#e7ece5] bg-[#f8faf6] px-3 text-xs text-[#7b8981]">.{baseDomain}</span>
        </div>
        <p id="school-url-preview" className="text-sm text-[#64736d]">Your school portal: <span className="font-semibold text-[#1d765b]">{answers.slug || 'your-school'}.{baseDomain}</span></p>
        <button type="button" disabled={slugStatus === 'checking' || !answers.slug} onClick={() => { setError(''); void checkSlugAvailability(answers.slug); }} className="rounded-lg border border-[#cbd6cc] px-4 py-2 text-sm font-bold text-[#1d765b] disabled:opacity-50">{slugStatus === 'checking' ? 'Checking…' : 'Check availability'}</button>
        <p id="slug-status" aria-live="polite" className={`text-sm ${slugStatus === 'taken' || slugStatus === 'error' ? 'text-red-700' : 'text-[#1d765b]'}`}>
          {slugStatus === 'available' && 'This school URL is available.'}
          {slugStatus === 'taken' && 'This school URL is already in use.'}
          {slugStatus === 'error' && 'The school URL could not be checked.'}
        </p>
      </div>}
      {error && <p role="alert" className="mt-5 rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d]">{error}</p>}
      <div className="mt-8 flex justify-between border-t border-[#edf0e9] pt-5">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting} className="rounded-lg border px-4 py-2.5 text-sm font-bold disabled:opacity-40">Back</button>
        {step < steps.length - 1 ? <button type="button" disabled={loadingProfile} onClick={() => { setError(''); setStep((s) => Math.min(steps.length - 1, s + 1)); }} className="rounded-lg bg-[#1d765b] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">Continue</button> : <button type="submit" disabled={submitting || loadingProfile} className="rounded-lg bg-[#1d765b] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{submitting ? 'Saving…' : loadingProfile ? 'Loading…' : 'Finish setup'}</button>}
      </div>
    </form>
  </div>;
}

function Field({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (value: string) => void; maxLength: number }) {
  return <label className="block text-sm font-semibold">{label}<input value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} className="mt-2 w-full rounded-lg border border-[#d6ded5] px-3.5 py-3 outline-none focus:border-[#1d765b]" /></label>;
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="block text-sm font-semibold">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-[#d6ded5] bg-white px-3.5 py-3">{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center justify-between gap-4 rounded-lg border border-[#e1e8df] px-4 py-3.5 text-sm"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#1d765b]" /></label>;
}
