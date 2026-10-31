import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getTenant } from '@/lib/tenant';
import CustomDomainForm from './custom-domain-form';

export default async function DomainPage() {
  const session = await requireAuth();
  const tenant = await getTenant();
  if (!tenant || tenant.tenantId !== session.tenantId) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/dashboard');
  return <section><p className="text-sm font-semibold text-[#1d765b]">School branding</p><h1 className="mt-1 font-serif text-3xl font-semibold">Custom domain</h1><p className="mt-2 text-sm text-[#64736d]">Connect a school-owned hostname to your portal.</p><CustomDomainForm initialDomain={tenant.customDomain ?? ''} schoolSlug={tenant.slug} /></section>;
}
