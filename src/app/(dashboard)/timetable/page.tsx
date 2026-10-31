import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import TimetableForm from './timetable-form';
export default async function TimetablePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!['ADMIN', 'TEACHER'].includes(session.role)) redirect('/dashboard');
  return <><h1 className="font-serif text-3xl font-semibold">Timetable management</h1><p className="mt-2 text-sm text-[#64736d]">Create and update class periods.</p><TimetableForm /></>;
}
