import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getTenant } from '@/lib/tenant';
import AssetsAdmin from './assets-admin';

export default async function AssetsPage() {
  const session = await requireAuth();
  const tenant = await getTenant();
  if (!tenant || tenant.tenantId !== session.tenantId) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/dashboard');
  return <AssetsAdmin />;
}
