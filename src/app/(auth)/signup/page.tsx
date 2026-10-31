'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'skolhub.com';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to create your account.');
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
    <main className="grid min-h-screen bg-[#f5f7f1] md:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#174f40] p-12 text-white md:flex md:flex-col md:justify-between lg:p-16">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6f36a] text-[#174f40]">S</span> skolhub</Link>
        <div className="relative z-10 max-w-md pb-10"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d6f36a]">A better school day</p><h1 className="mt-5 font-serif text-5xl font-semibold leading-tight">Start with a school that runs in sync.</h1><p className="mt-5 leading-7 text-white/70">Bring your people, learners, and everyday school operations together.</p></div>
        <div className="absolute -bottom-28 -right-20 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 -right-12 h-72 w-72 rounded-full border border-white/10" />
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 font-bold md:hidden"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1d765b] text-white">S</span> skolhub</Link>
          <p className="text-sm font-semibold text-[#1d765b]">Create your school account</p>
          <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Let’s get started.</h2>
          <p className="mt-3 text-sm leading-6 text-[#64736d]">Set up your school workspace in a few steps.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="School name" name="schoolName" placeholder="Greenfield Academy" autoComplete="organization" />
            <Field label="Admin name" name="name" placeholder="Ada Okafor" autoComplete="name" />
            <Field label="Email address" name="email" type="email" placeholder="you@school.ng" autoComplete="email" />
            <Field label="Password" name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} />
            {error && <p role="alert" className="rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d]">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#1d765b] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Creating account…' : 'Create school account'}</button>
          </form>
          <p className="mt-3 text-center text-xs text-[#87938c]">Your school URL on {baseDomain} can be chosen during setup.</p>
          <p className="mt-6 text-center text-sm text-[#64736d]">Already have an account? <Link href="/login" className="font-bold text-[#1d765b] hover:underline">Log in</Link></p>
        </div>
      </section>
    </main>
  );
}

function Field({ label, name, type = 'text', ...props }: { label: string; name: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">{label}</label>
      <input id={name} name={name} type={type} required {...props} className="w-full rounded-lg border border-[#d6ded5] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#a0aaa2] focus:border-[#1d765b] focus:ring-2 focus:ring-[#1d765b]/15" />
    </div>
  );
}