import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

export default async function FinancePage() {
  const session = await requireAuth();
  const tenant = await getTenant();
  if (!tenant || tenant.tenantId !== session.tenantId) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/dashboard');

  const transactions = await db.transaction.findMany({
    where: { tenantId: session.tenantId, status: 'success' },
    orderBy: { createdAt: 'desc' },
    select: { amount: true, platformFee: true },
  });
  const totalCollected = transactions.reduce((sum, item) => sum + item.amount, 0);
  const platformFees = transactions.reduce((sum, item) => sum + item.platformFee, 0);
  const formatAmount = (amount: number) => `${tenant.currency} ${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return <section><p className="text-sm font-semibold text-[#1d765b]">School finance</p><h1 className="mt-1 font-serif text-3xl font-semibold">Finance ledger</h1><p className="mt-2 text-sm text-[#64736d]">Successful Paystack payments, recorded in minor currency units.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <article className="rounded-xl border border-[#e1e8df] bg-white p-5"><p className="text-sm text-[#64736d]">Total collected</p><p className="mt-2 text-2xl font-bold">{formatAmount(totalCollected)}</p></article>
      <article className="rounded-xl border border-[#e1e8df] bg-white p-5"><p className="text-sm text-[#64736d]">Platform fees paid</p><p className="mt-2 text-2xl font-bold">{formatAmount(platformFees)}</p></article>
      <article className="rounded-xl border border-[#e1e8df] bg-white p-5"><p className="text-sm text-[#64736d]">Net school revenue</p><p className="mt-2 text-2xl font-bold">{formatAmount(totalCollected - platformFees)}</p></article>
    </div>
    <div className="mt-6 overflow-hidden rounded-xl border border-[#e1e8df] bg-white"><h2 className="border-b border-[#edf0e9] px-5 py-4 font-bold">Transactions</h2>{transactions.length ? <table className="w-full text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase text-[#718078]"><tr><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Platform fee</th><th className="px-5 py-3">Net revenue</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{transactions.map((item, index) => <tr key={`${item.amount}-${item.platformFee}-${index}`}><td className="px-5 py-3">{formatAmount(item.amount)}</td><td className="px-5 py-3">{formatAmount(item.platformFee)}</td><td className="px-5 py-3">{formatAmount(item.amount - item.platformFee)}</td></tr>)}</tbody></table> : <p className="p-5 text-sm text-[#64736d]">No successful payments have been recorded.</p>}</div>
  </section>;
}
