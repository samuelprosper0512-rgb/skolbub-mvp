'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to log in.');
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
        <div className="relative z-10 max-w-md pb-10"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d6f36a]">Your school, connected</p><h1 className="mt-5 font-serif text-5xl font-semibold leading-tight">A clear view of what matters, every day.</h1><p className="mt-5 leading-7 text-white/70">Sign in to pick up where your school left off.</p></div>
        <div className="absolute -bottom-28 -right-20 h-96 w-96 rounded-full border border-white/10" />
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 font-bold md:hidden"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1d765b] text-white">S</span> skolhub</Link>
          <p className="text-sm font-semibold text-[#1d765b]">Welcome back</p>
          <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Log in to Skolhub.</h2>
          <p className="mt-3 text-sm leading-6 text-[#64736d]">Use your school email to continue.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="Email address" name="email" type="email" placeholder="you@school.ng" autoComplete="email" />
            <Field label="Password" name="password" type="password" placeholder="Your password" autoComplete="current-password" />
            {error && <p role="alert" className="rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d]">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#1d765b] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Logging in…' : 'Log in'}</button>
          </form>
          <p className="mt-6 text-center text-sm text-[#64736d]">New to Skolhub? <Link href="/signup" className="font-bold text-[#1d765b] hover:underline">Create a school account</Link></p>
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