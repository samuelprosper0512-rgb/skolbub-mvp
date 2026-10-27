import Link from 'next/link';

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f5f7f1]">
      <header className="border-b border-[#e1e8df] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/portal" className="flex items-center gap-3 text-lg font-bold"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1d765b] text-white">S</span> skolhub <span className="ml-1 border-l border-[#e1e8df] pl-3 text-sm font-medium text-[#64736d]">Student portal</span></Link>
          <nav aria-label="Student navigation" className="flex items-center gap-5">
            <Link href="/portal/cbt" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">My Exams</Link>
            <Link href="/portal/fees" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Fees</Link>
            <Link href="/" className="text-sm font-semibold text-[#64736d] hover:text-[#1d765b]">Home</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}