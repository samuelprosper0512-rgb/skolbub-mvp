import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

export default async function SuperAdminPage() {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session || session.role !== 'SUPER_ADMIN' || tenant?.tenantId !== session.tenantId) redirect('/login');

  const [districts, feeTotals] = await Promise.all([
    db.district.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        tenants: {
          orderBy: { name: 'asc' },
          select: { id: true, tenantId: true, name: true, slug: true, _count: { select: { students: true } } },
        },
      },
    }),
    db.fee.groupBy({
      by: ['tenantId', 'status'],
      _sum: { amount: true },
    }),
  ]);
  const totalsByTenant = new Map<string, { paid: number; unpaid: number }>();
  for (const fee of feeTotals) {
    const totals = totalsByTenant.get(fee.tenantId) ?? { paid: 0, unpaid: 0 };
    if (fee.status === 'paid') totals.paid += fee._sum.amount ?? 0;
    else totals.unpaid += fee._sum.amount ?? 0;
    totalsByTenant.set(fee.tenantId, totals);
  }
  const money = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

  return <main className="min-h-screen bg-[#f5f7f1] px-5 py-10 sm:px-8"><div className="mx-auto max-w-6xl"><p className="text-sm font-semibold text-[#1d765b]">Platform administration</p><h1 className="mt-1 font-serif text-3xl font-semibold">District overview</h1><p className="mt-2 text-sm text-[#64736d]">Aggregated school activity across your districts.</p>
    <div className="mt-7 space-y-6">{districts.map((district) => <section key={district.id} className="overflow-hidden rounded-xl border border-[#e1e8df] bg-white"><div className="border-b border-[#edf0e9] px-5 py-4"><h2 className="text-lg font-bold">{district.name}</h2><p className="mt-1 text-sm text-[#64736d]">{district.tenants.length} schools</p></div>{district.tenants.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase text-[#718078]"><tr><th className="px-5 py-3">School</th><th className="px-5 py-3">Students</th><th className="px-5 py-3">Fees collected</th><th className="px-5 py-3">Unpaid fees</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{district.tenants.map((school) => { const totals = totalsByTenant.get(school.tenantId) ?? { paid: 0, unpaid: 0 }; return <tr key={school.id}><td className="px-5 py-4"><p className="font-semibold">{school.name}</p><p className="text-xs text-[#87938c]">{school.slug}</p></td><td className="px-5 py-4">{school._count.students}</td><td className="px-5 py-4">{money.format(totals.paid)}</td><td className="px-5 py-4">{money.format(totals.unpaid)}</td></tr>; })}</tbody></table></div> : <p className="p-5 text-sm text-[#64736d]">No schools are assigned to this district.</p>}</section>)}
      {districts.length === 0 && <p className="rounded-xl border border-dashed border-[#cbd6cc] bg-white p-8 text-center text-sm text-[#64736d]">No districts have been configured yet.</p>}
    </div>
  </div></main>;
}
