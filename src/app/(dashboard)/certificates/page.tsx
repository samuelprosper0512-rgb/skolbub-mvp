import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';
import CertificatePrint from './certificate-print';

export default async function CertificatesPage() {
  const session = await requireAuth();
  const tenant = await getTenant();
  if (!tenant || tenant.tenantId !== session.tenantId) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/dashboard');
  const students = await db.student.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, studentNumber: true, gradeLevel: true },
  });
  return <CertificatePrint schoolName={tenant.name} motto={tenant.motto} students={students} />;
}
