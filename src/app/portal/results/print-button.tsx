'use client';

export default function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48]">Print Report Card</button>;
}