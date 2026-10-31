import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getTenant } from '@/lib/tenant';
import Homework from './homework';

export default async function AssignmentsPage() {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session || session.role !== 'STUDENT' || tenant?.tenantId !== session.tenantId) redirect('/login');
  return <Homework />;
}
