import Link from 'next/link';

const metrics = [
  { label: 'Students enrolled', value: '1,284', change: '+8.2%' },
  { label: 'Attendance today', value: '96.4%', change: 'On track' },
  { label: 'Upcoming exams', value: '06', change: 'This week' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f1]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Skolhub home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1d765b] text-lg font-bold text-white">S</span>
          <span className="text-xl font-bold tracking-tight">skolhub</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#29443a] hover:bg-white/70">Log in</Link>
          <Link href="/signup" className="rounded-lg bg-[#172521] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d765b]">Get started</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-10 sm:px-10 md:grid-cols-[1.05fr_0.95fr] md:pb-28 md:pt-16">
        <div className="animate-[rise-in_700ms_ease-out_both]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dce4d8] bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#426254]">
            <span className="h-2 w-2 rounded-full bg-[#81b849]" /> Built for Nigerian schools
          </div>
          <h1 className="max-w-2xl font-serif text-5xl font-semibold leading-[1.04] tracking-tight text-[#172521] sm:text-6xl lg:text-7xl">
            The complete school platform for Nigeria
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#64736d]">
            Spend less time chasing paperwork and more time helping every learner thrive. Bring your school day into one clear, connected space.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="rounded-lg bg-[#1d765b] px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(29,118,91,0.2)] transition hover:-translate-y-0.5 hover:bg-[#155e48]">Create your school</Link>
            <Link href="/login" className="rounded-lg border border-[#cbd6cc] bg-white/60 px-6 py-3.5 text-sm font-bold text-[#29443a] transition hover:bg-white">Log in to Skolhub</Link>
          </div>
          <div className="mt-10 flex items-center gap-4 text-sm text-[#64736d]">
            <div className="flex -space-x-2" aria-hidden="true">
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f5f7f1] bg-[#d5a77d] text-[10px] font-bold text-white">AO</span>
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f5f7f1] bg-[#6a9c8b] text-[10px] font-bold text-white">FM</span>
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f5f7f1] bg-[#b46e55] text-[10px] font-bold text-white">CN</span>
            </div>
            <span>Made for the people who make schools work.</span>
          </div>
        </div>

        <div className="relative animate-[rise-in_850ms_120ms_ease-out_both]">
          <div className="absolute -right-10 -top-8 h-40 w-40 rounded-full border border-[#d4ddcf] opacity-70" />
          <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-[#d6f36a]" />
          <div className="relative overflow-hidden rounded-2xl border border-[#dce4d8] bg-white shadow-[0_28px_80px_rgba(35,61,49,0.13)]">
            <div className="flex items-center justify-between border-b border-[#e9eee7] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e8f3e8] text-sm font-bold text-[#1d765b]">G</span>
                <div><p className="text-sm font-bold">Greenfield Academy</p><p className="mt-0.5 text-xs text-[#87938c]">School overview</p></div>
              </div>
              <span className="rounded-md bg-[#f2f6ec] px-2.5 py-1.5 text-[11px] font-semibold text-[#557542]">2025 / 2026</span>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div><p className="text-xs font-medium text-[#87938c]">Good morning, Ada</p><h2 className="mt-1 text-xl font-bold">Your school at a glance</h2></div>
                <span className="mb-1 hidden rounded-md bg-[#edf6ee] px-2.5 py-1.5 text-[11px] font-semibold text-[#1d765b] sm:inline-flex">● All systems ready</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-[#edf0e9] bg-[#fbfcf9] p-3 sm:p-4">
                    <p className="text-[10px] leading-4 text-[#7b8981] sm:text-xs">{metric.label}</p>
                    <p className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{metric.value}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#478464] sm:text-xs">{metric.change}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg bg-[#f3f6f0] p-4">
                <div className="flex items-center justify-between"><p className="text-xs font-bold">This week</p><p className="text-[10px] text-[#87938c]">Mon – Fri</p></div>
                <div className="mt-4 flex h-24 items-end gap-3" aria-label="Illustrative weekly attendance chart">
                  {[61, 82, 72, 94, 76, 88, 67, 96, 79, 86, 70, 91, 77, 84].map((height, index) => (
                    <span key={index} className={`w-full rounded-t-sm ${index === 7 ? 'bg-[#1d765b]' : 'bg-[#b8d7b6]'}`} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-[#87938c]"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 right-4 hidden items-center gap-3 rounded-xl border border-[#e1e9db] bg-white px-4 py-3 shadow-lg sm:flex">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e9f4d0] text-[#4c702b]">✓</span>
            <div><p className="text-xs font-bold">Everything in sync</p><p className="mt-0.5 text-[11px] text-[#87938c]">One home for your school day</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}