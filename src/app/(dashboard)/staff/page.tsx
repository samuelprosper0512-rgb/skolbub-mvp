import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import StaffForm from './staff-form';

export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/dashboard');

  const staff = await db.staff.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <>
      <div><p className="text-sm font-semibold text-[#1d765b]">School administration</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Staff</h1><p className="mt-2 text-sm text-[#64736d]">Manage your school’s staff directory.</p></div>
      <StaffForm />
      <section className="mt-7 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        <h2 className="px-5 py-4 text-base font-bold">Current staff</h2>
        {staff.length === 0 ? <p className="border-t border-[#edf0e9] px-5 py-10 text-center text-sm text-[#64736d]">No staff members have been added yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#718078]"><tr><th className="px-5 py-3.5 font-semibold">Name</th><th className="px-5 py-3.5 font-semibold">Email</th><th className="px-5 py-3.5 font-semibold">Role</th><th className="px-5 py-3.5 font-semibold">Added</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{staff.map((member) => <tr key={member.id}><td className="px-5 py-4 font-semibold">{member.name}</td><td className="px-5 py-4 text-[#64736d]">{member.email}</td><td className="px-5 py-4 text-[#64736d]">{member.role}</td><td className="px-5 py-4 text-[#64736d]">{member.createdAt.toLocaleDateString()}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </>
  );
}
