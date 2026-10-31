import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getTenant } from '@/lib/tenant';
import AssignmentsAdmin from './assignments-admin';

export default async function AssignmentsPage() {
  const session = await requireAuth();
  const tenant = await getTenant();
  if (!tenant || tenant.tenantId !== session.tenantId) redirect('/login');
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') redirect('/dashboard');
  return <AssignmentsAdmin />;
}
