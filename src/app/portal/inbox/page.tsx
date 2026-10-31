import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import InboxClient from '@/app/inbox/inbox-client';

export default async function PortalInboxPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'STUDENT' && session.role !== 'PARENT') redirect('/dashboard');
  return <><h1 className="font-serif text-3xl font-semibold">Inbox</h1><p className="mt-2 text-sm text-[#64736d]">Send and receive messages within your school.</p><InboxClient currentUserId={session.userId} /></>;
}
