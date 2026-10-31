'use client';

import { FormEvent, useEffect, useState } from 'react';

type Asset = { id: string; name: string; category: string; quantity: number; condition: string; location: string };

export default function AssetsAdmin() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/assets');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load assets.');
    setAssets(data.assets);
  }

  useEffect(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load assets.')); }, []);

  async function addAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || 'Unable to add asset.'); return; }
    form.reset();
    setMessage('Asset added.');
    await load();
  }

  async function updateCondition(asset: Asset, condition: string) {
    const response = await fetch('/api/assets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: asset.id, condition }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || 'Unable to update asset.'); return; }
    setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, condition } : item));
  }

  return <section><p className="text-sm font-semibold text-[#1d765b]">School operations</p><h1 className="mt-1 font-serif text-3xl font-semibold">Inventory & assets</h1>
    <form onSubmit={addAsset} className="mt-6 grid gap-4 rounded-xl border border-[#e1e8df] bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-semibold">Asset name<input required name="name" className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">Category<input required name="category" className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">Quantity<input required name="quantity" type="number" min="1" defaultValue="1" className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">Condition<input required name="condition" defaultValue="Good" className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">Location<input required name="location" className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <button className="self-end rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white">Add asset</button>
      {message && <p role="status" className="text-sm text-[#64736d] sm:col-span-2">{message}</p>}
    </form>
    <div className="mt-6 overflow-hidden rounded-xl border border-[#e1e8df] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase text-[#718078]"><tr><th className="px-5 py-3">Asset</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Condition</th><th className="px-5 py-3">Location</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{assets.map((asset) => <tr key={asset.id}><td className="px-5 py-3 font-semibold">{asset.name}</td><td className="px-5 py-3">{asset.category}</td><td className="px-5 py-3">{asset.quantity}</td><td className="px-5 py-3"><label className="sr-only" htmlFor={`condition-${asset.id}`}>Condition for {asset.name}</label><select id={`condition-${asset.id}`} value={asset.condition} onChange={(event) => void updateCondition(asset, event.target.value)} className="rounded border px-2 py-1"><option>Good</option><option>Fair</option><option>Needs repair</option><option>Unusable</option></select></td><td className="px-5 py-3">{asset.location}</td></tr>)}</tbody></table></div>{assets.length === 0 && <p className="p-5 text-sm text-[#64736d]">No assets registered.</p>}</div>
  </section>;
}
