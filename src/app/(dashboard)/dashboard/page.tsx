import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await requireAuth();
  const [tenant, studentCount] = await Promise.all([
    getTenant(),
    db.student.count({ where: { tenantId: session.tenantId } }),
  ]);
  if (!tenant || tenant.tenantId !== session.tenantId) redirect('/login');

  return (
    <>
      <div><p className="text-sm font-semibold" style={{ color: tenant.primaryColor }}>Overview</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Welcome to {tenant.name} ({tenant.schoolType} school)</h1><p className="mt-2 text-sm text-[#64736d]">Good day, {session.name.split(' ')[0]}. Here’s what’s happening at your school.</p></div>
      <section aria-label="School statistics" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[#e1e8df] bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#64736d]">Total students</p><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e8f3e8] text-sm font-bold text-[#1d765b]">#</span></div><p className="mt-5 text-3xl font-bold tracking-tight">{studentCount}</p><p className="mt-1 text-xs text-[#87938c]">Across all grade levels</p></div>
        {tenant.enableCBT && <div className="rounded-xl border border-[#e1e8df] bg-white p-5"><p className="text-sm font-semibold text-[#64736d]">Computer-based testing</p><p className="mt-5 text-lg font-bold">CBT is enabled</p><p className="mt-1 text-xs text-[#87938c]">Manage exams for your students.</p><a href="/cbt" className="mt-4 inline-block text-sm font-bold" style={{ color: tenant.primaryColor }}>Manage exams</a></div>}
        <div className="rounded-xl border border-[#e1e8df] bg-white p-5"><p className="text-sm font-semibold text-[#64736d]">School workspace</p><p className="mt-5 text-lg font-bold">{tenant.ownership === 'public' ? 'Public school' : 'Private school'}</p><p className="mt-1 text-xs text-[#87938c]">{tenant.hasComputerLabs ? 'Computer labs available' : 'School setup is ready to customize.'}</p></div>
      </section>
      {studentCount === 0 && <section className="mt-6 rounded-xl border border-dashed border-[#cbd6cc] bg-white/60 p-6"><h2 className="text-base font-bold">Your student list starts here</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#64736d]">There are no students in this workspace yet. Once students are added, you’ll see your school’s total here.</p></section>}
    </>
  );
}