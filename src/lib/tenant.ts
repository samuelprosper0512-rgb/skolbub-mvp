import { cookies } from 'next/headers';
import type { Session } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getTenant() {
  const slug = cookies().get('tenant_slug')?.value;
  if (!slug) return null;

  return db.tenant.findUnique({
    where: { slug },
  });
}

export async function getTenantForSession(session: Session) {
  const tenant = await getTenant();
  return tenant?.tenantId === session.tenantId ? tenant : null;
}