import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function DashboardPage() {
  const session = await requireAuth();
  const studentCount = await db.student.count({ where: { tenantId: session.tenantId } });

  return (
    <>
      <div><p className="text-sm font-semibold text-[#1d765b]">Overview</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Good day, {session.name.split(' ')[0]}.</h1><p className="mt-2 text-sm text-[#64736d]">Here’s what’s happening at your school.</p></div>
      <section aria-label="School statistics" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[#e1e8df] bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#64736d]">Total students</p><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e8f3e8] text-sm font-bold text-[#1d765b]">#</span></div><p className="mt-5 text-3xl font-bold tracking-tight">{studentCount}</p><p className="mt-1 text-xs text-[#87938c]">Across all grade levels</p></div>
        <div className="rounded-xl border border-[#e1e8df] bg-white p-5"><p className="text-sm font-semibold text-[#64736d]">School workspace</p><p className="mt-5 text-lg font-bold">Ready for your team</p><p className="mt-1 text-xs text-[#87938c]">Your school data stays together.</p></div>
      </section>
      {studentCount === 0 && <section className="mt-6 rounded-xl border border-dashed border-[#cbd6cc] bg-white/60 p-6"><h2 className="text-base font-bold">Your student list starts here</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#64736d]">There are no students in this workspace yet. Once students are added, you’ll see your school’s total here.</p></section>}
    </>
  );
}