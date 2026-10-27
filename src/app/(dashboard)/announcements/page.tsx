import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import AnnouncementForm from './announcement-form';

export default async function AnnouncementsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/dashboard');

  const announcements = await db.announcement.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <>
      <div><p className="text-sm font-semibold text-[#1d765b]">School communication</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Announcements</h1><p className="mt-2 text-sm text-[#64736d]">Share school news and updates with your community.</p></div>
      <AnnouncementForm />
      <section className="mt-7 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        <h2 className="px-5 py-4 text-base font-bold">Past announcements</h2>
        {announcements.length === 0 ? <p className="border-t border-[#edf0e9] px-5 py-10 text-center text-sm text-[#64736d]">No announcements have been published yet.</p> : (
          <ul className="divide-y divide-[#edf0e9]">{announcements.map((announcement) => <li key={announcement.id} className="px-5 py-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold">{announcement.title}</h3><time className="text-xs text-[#87938c]" dateTime={announcement.createdAt.toISOString()}>{announcement.createdAt.toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#64736d]">{announcement.content}</p></li>)}</ul>
        )}
      </section>
    </>
  );
}
