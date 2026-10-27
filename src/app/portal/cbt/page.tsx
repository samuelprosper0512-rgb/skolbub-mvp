import { getTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import CBTExamList from './cbt-exam-list';

export default async function PortalCBTPage() {
  const tenant = await getTenant();
  const exams = tenant
    ? await db.cBTExam.findMany({
        where: { tenantId: tenant.tenantId },
        orderBy: [{ gradeLevel: 'asc' }, { title: 'asc' }],
        select: { id: true, title: true, subject: true, gradeLevel: true, duration: true },
      })
    : [];

  return (
    <>
      <div>
        <p className="text-sm font-semibold text-[#1d765b]">{tenant?.name || 'Student portal'}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">My exams</h1>
        <p className="mt-2 text-sm text-[#64736d]">Find the CBT exams assigned to your grade level.</p>
      </div>
      <CBTExamList exams={exams} />
    </>
  );
}