import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getTenant } from '@/lib/tenant';
import ParentDashboard from './parent-dashboard';

export default async function ParentPage() {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session || session.role !== 'PARENT' || tenant?.tenantId !== session.tenantId) redirect('/login');

  return <ParentDashboard />;
}
