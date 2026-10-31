import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import FeeForm from './fee-form';
import ExportCsvButton from '../export-csv-button';

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

export default async function FeesPage() {
  const session = await requireAuth();
  if (session.role !== 'ADMIN') {
    return <p className="text-sm text-[#64736d]">Admin access is required to manage fees.</p>;
  }

  const [students, fees] = await Promise.all([
    db.student.findMany({
      where: { tenantId: session.tenantId },
      select: { id: true, name: true, studentNumber: true },
      orderBy: { name: 'asc' },
    }),
    db.fee.findMany({
      where: { tenantId: session.tenantId },
      include: { student: { select: { name: true, studentNumber: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <>
      <div>
        <p className="text-sm font-semibold text-[#1d765b]">School finance</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Fees</h1>
        <p className="mt-2 text-sm text-[#64736d]">Assign and track student fees for your school.</p>
      </div>
      <div className="mt-5"><ExportCsvButton type="fees" /></div>
      <FeeForm students={students} />
      <section className="mt-7 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        <div className="border-b border-[#edf0e9] px-5 py-4"><h2 className="font-bold">Assigned fees</h2><p className="mt-1 text-xs text-[#87938c]">{fees.length} {fees.length === 1 ? 'fee' : 'fees'}</p></div>
        {fees.length === 0 ? <p className="px-5 py-12 text-center text-sm text-[#64736d]">No fees have been assigned yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#718078]"><tr><th className="px-5 py-3.5 font-semibold">Student</th><th className="px-5 py-3.5 font-semibold">Fee</th><th className="px-5 py-3.5 font-semibold">Amount</th><th className="px-5 py-3.5 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{fees.map((fee) => <tr key={fee.id}><td className="px-5 py-4"><p className="font-semibold">{fee.student.name}</p><p className="mt-1 text-xs text-[#87938c]">{fee.student.studentNumber}</p></td><td className="px-5 py-4">{fee.title}</td><td className="px-5 py-4 font-semibold">{naira.format(fee.amount)}</td><td className="px-5 py-4"><span className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${fee.status === 'paid' ? 'bg-[#edf6ee] text-[#1d765b]' : 'bg-[#fff4df] text-[#8a6219]'}`}>{fee.status}</span></td></tr>)}</tbody></table></div>
        )}
      </section>
    </>
  );
}