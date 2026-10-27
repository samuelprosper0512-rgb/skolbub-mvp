'use client';

import { useEffect, useState } from 'react';

type Fee = {
  id: string;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
};

export default function PortalFeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [payingFeeId, setPayingFeeId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadFees() {
      try {
        const response = await fetch('/api/portal/fees');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load your fees.');
        if (active) setFees(result.fees);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load your fees.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadFees();
    return () => { active = false; };
  }, []);

  async function payFee(feeId: string) {
    setPaymentError('');
    setPayingFeeId(feeId);
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeId }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.authorization_url !== 'string') {
        setPaymentError(result.error || 'Unable to start this payment. Please try again.');
        return;
      }
      window.location.href = result.authorization_url;
    } catch {
      setPaymentError('A network error occurred while starting your payment. Please try again.');
    } finally {
      setPayingFeeId('');
    }
  }

  return (
    <>
      <div><p className="text-sm font-semibold text-[#1d765b]">Student portal</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">My fees</h1><p className="mt-2 text-sm text-[#64736d]">View your school fees and payment status.</p></div>
      <section className="mt-7 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        {paymentError && <p role="alert" className="m-4 rounded-lg bg-[#fff0ed] px-3.5 py-3 text-sm text-[#a6402d]">{paymentError}</p>}
        {loading ? <p className="px-5 py-12 text-center text-sm text-[#64736d]">Loading your fees…</p> : error ? <p role="alert" className="px-5 py-12 text-center text-sm text-[#a6402d]">{error}</p> : fees.length === 0 ? <p className="px-5 py-12 text-center text-sm text-[#64736d]">There are no fees assigned to you yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#718078]"><tr><th className="px-5 py-3.5 font-semibold">Fee</th><th className="px-5 py-3.5 font-semibold">Amount</th><th className="px-5 py-3.5 font-semibold">Status</th><th className="px-5 py-3.5 font-semibold">Payment</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{fees.map((fee) => <tr key={fee.id}><td className="px-5 py-4 font-semibold">{fee.title}</td><td className="px-5 py-4 font-semibold">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(fee.amount)}</td><td className="px-5 py-4"><span className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${fee.status === 'paid' ? 'bg-[#edf6ee] text-[#1d765b]' : 'bg-[#fff4df] text-[#8a6219]'}`}>{fee.status}</span></td><td className="px-5 py-4">{fee.status === 'paid' ? <span className="text-xs font-semibold text-[#1d765b]">Paid</span> : <button type="button" disabled={Boolean(payingFeeId)} onClick={() => void payFee(fee.id)} className="rounded-lg bg-[#1d765b] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#155e48] disabled:cursor-not-allowed disabled:opacity-60">{payingFeeId === fee.id ? 'Redirecting…' : 'Pay Now'}</button>}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </>
  );
}