import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getTenant } from '@/lib/tenant';
import HostelsAdmin from './hostels-admin';

export default async function HostelsPage() {
  const session = await requireAuth();
  const tenant = await getTenant();
  if (!tenant || tenant.tenantId !== session.tenantId) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/dashboard');
  return <HostelsAdmin />;
}
