import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

export default async function PortalPage() {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  const validSession = session && tenant?.tenantId === session.tenantId ? session : null;
  const exams = tenant
    ? await db.cBTExam.findMany({ where: { tenantId: tenant.tenantId }, orderBy: { title: 'asc' } })
    : [];
  const announcements = tenant
    ? await db.announcement.findMany({
        where: { tenantId: tenant.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, title: true, content: true, createdAt: true },
      })
    : [];

  return (
    <>
      <section className="rounded-2xl bg-[#174f40] px-6 py-8 text-white sm:px-9 sm:py-10"><p className="text-sm font-semibold text-[#d6f36a]">{tenant?.name || 'Your school'}</p><h1 className="mt-2 font-serif text-3xl font-semibold">{validSession ? `Welcome, ${validSession.name.split(' ')[0]}.` : 'Welcome to your portal.'}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/70">Your school information and available computer-based exams are all in one place.</p></section>
      {announcements.length > 0 && <section aria-labelledby="portal-announcements" className="mt-6 rounded-xl border border-[#e1e8df] bg-white"><div className="border-b border-[#edf0e9] px-5 py-4"><h2 id="portal-announcements" className="font-bold">School announcements</h2></div><ul className="divide-y divide-[#edf0e9]">{announcements.map((announcement) => <li key={announcement.id} className="px-5 py-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-semibold">{announcement.title}</h3><time dateTime={announcement.createdAt.toISOString()} className="text-xs text-[#87938c]">{announcement.createdAt.toLocaleDateString()}</time></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#64736d]">{announcement.content}</p></li>)}</ul></section>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-xl border border-[#e1e8df] bg-white p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1d765b]">Profile</p><h2 className="mt-2 text-lg font-bold">Your details</h2>{validSession ? <dl className="mt-5 space-y-4 text-sm"><div><dt className="text-[#87938c]">Name</dt><dd className="mt-1 font-semibold">{validSession.name}</dd></div><div><dt className="text-[#87938c]">Email</dt><dd className="mt-1 font-semibold">{validSession.email}</dd></div><div><dt className="text-[#87938c]">School</dt><dd className="mt-1 font-semibold">{tenant?.name}</dd></div></dl> : <p className="mt-4 text-sm leading-6 text-[#64736d]">Sign in from your school’s Skolhub address to view your account profile.</p>}</section>
        <section className="rounded-xl border border-[#e1e8df] bg-white p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1d765b]">Assessment</p><h2 className="mt-2 text-lg font-bold">Available CBT exams</h2>{exams.length > 0 ? <ul className="mt-4 divide-y divide-[#edf0e9]">{exams.map((exam) => <li key={exam.id} className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-semibold">{exam.title}</p><p className="mt-1 text-xs text-[#64736d]">{exam.subject}</p></div><span className="shrink-0 rounded-md bg-[#f2f6ec] px-2.5 py-1.5 text-xs font-semibold text-[#557542]">{exam.duration} min</span></li>)}</ul> : <p className="mt-4 text-sm text-[#64736d]">There are no CBT exams available at the moment.</p>}</section>
      </div>
    </>
  );
}