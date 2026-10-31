import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getTenant } from '@/lib/tenant';
import NotificationBell from '@/app/notification-bell';

export default async function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  const isParent = session?.role === 'PARENT' && tenant?.tenantId === session.tenantId;

  return (
    <div className="min-h-screen bg-[#f5f7f1]">
      <header className="border-b border-[#e1e8df] bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-y-2 px-5 py-3 sm:px-8">
          <Link href="/portal" className="flex items-center gap-3 text-lg font-bold"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1d765b] text-white">S</span> skolhub <span className="ml-1 border-l border-[#e1e8df] pl-3 text-sm font-medium text-[#64736d]">Student portal</span></Link>
          <nav aria-label="Student navigation" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/portal/cbt" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">My Exams</Link>
            <Link href="/portal/results" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Results</Link>
            <Link href="/portal/attendance" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Attendance</Link>
            <Link href="/portal/inbox" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Inbox</Link>
            <Link href="/portal/timetable" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Timetable</Link>
            <Link href="/portal/library" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Library</Link>
            <Link href="/portal/behavior" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Behavior</Link>
            <Link href="/portal/health" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Health</Link>
            <Link href="/portal/fees" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Fees</Link>
            <Link href="/portal/assignments" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Homework</Link>
            {isParent && <Link href="/portal/parent" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Family dashboard</Link>}
            <Link href="/" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Home</Link>
          </nav>
          {session && tenant?.tenantId === session.tenantId && <NotificationBell />}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}