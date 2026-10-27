import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function getTenant() {
  const slug = cookies().get('tenant_slug')?.value;
  if (!slug) return null;

  return db.tenant.findUnique({
    where: { slug },
  });
}