import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getTenant } from '@/lib/tenant';

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/students', label: 'Students', icon: '◉' },
  { href: '/results', label: 'Results', icon: '▤' },
  { href: '/cbt', label: 'CBT Exams', icon: '✓' },
  { href: '/fees', label: 'Fees', icon: '₦' },
  { href: '/onboarding', label: 'Onboarding Wizard', icon: '✦' },
];

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();
  const tenant = await getTenant();
  if (!tenant || tenant.tenantId !== session.tenantId) redirect('/login');

  return (
    <div className="min-h-screen bg-[#f5f7f1] md:grid md:grid-cols-[240px_1fr]">
      <aside style={{ borderTopColor: tenant.primaryColor, borderLeftColor: tenant.primaryColor }} className="flex flex-col border-b border-t-4 border-[#e1e8df] bg-white px-5 py-5 md:min-h-screen md:border-b-0 md:border-l-4 md:border-r md:px-4">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 text-lg font-bold"><span style={{ backgroundColor: tenant.primaryColor }} className="grid h-9 w-9 place-items-center rounded-lg text-white">S</span> skolhub</Link>
        <div className="mt-8 rounded-lg bg-[#f5f7f1] px-3 py-3"><p className="truncate text-sm font-bold">{tenant.name}</p><p className="mt-1 text-xs text-[#7b8981]">School workspace</p></div>
        <nav aria-label="Main navigation" className="mt-6 flex gap-1 overflow-x-auto md:flex-col">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#53645b] transition hover:bg-[#edf5eb] hover:text-[#1d765b]">
              <span className="grid h-5 w-5 place-items-center text-base" aria-hidden="true">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-[#edf0e9] pt-5 md:block"><p className="truncate px-2 text-sm font-semibold">{session.name}</p><p className="mt-1 truncate px-2 text-xs text-[#7b8981]">{session.email}</p></div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-[#e1e8df] bg-white px-6 sm:px-9">
          <p className="text-sm font-semibold text-[#64736d]">School administration</p>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8f3e8] text-sm font-bold text-[#1d765b]">{session.name.slice(0, 1).toUpperCase()}</span>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-9 sm:py-10">{children}</main>
      </div>
    </div>
  );
}