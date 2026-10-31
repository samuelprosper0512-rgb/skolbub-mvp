'use client';

export default function ExportCsvButton({ type }: { type: 'students' | 'fees' | 'results' }) {
  return <a href={`/api/export/${type}`} className="inline-flex items-center rounded-lg border border-[#cbd6cc] bg-white px-3 py-2 text-sm font-semibold text-[#1d765b] hover:bg-[#f5f7f1]">Export to CSV</a>;
}
