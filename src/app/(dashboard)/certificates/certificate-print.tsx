'use client';

import { useState } from 'react';

type Student = { id: string; name: string; studentNumber: string; gradeLevel: string };

export default function CertificatePrint({ schoolName, motto, students }: { schoolName: string; motto: string; students: Student[] }) {
  const [studentId, setStudentId] = useState('');
  const student = students.find((item) => item.id === studentId);

  return <section><div className="print:hidden"><p className="text-sm font-semibold text-[#1d765b]">School records</p><h1 className="mt-1 font-serif text-3xl font-semibold">Print certificate</h1><p className="mt-2 text-sm text-[#64736d]">Select a student, then use the print dialog to save the certificate as a PDF.</p><div className="mt-5 flex flex-wrap items-end gap-3"><label className="text-sm font-semibold">Student<select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="mt-1 block min-w-64 rounded-lg border border-[#d8e1d8] bg-white px-3 py-2"><option value="">Select a student</option>{students.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.studentNumber}</option>)}</select></label><button disabled={!student} onClick={() => window.print()} className="rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Print / Save PDF</button></div></div>
    {student ? <article id="certificate" className="mx-auto mt-8 flex min-h-[680px] max-w-4xl flex-col items-center justify-center border-[12px] border-double border-[#b99453] bg-white px-10 py-16 text-center shadow-xl print:mt-0 print:min-h-screen print:max-w-none print:border-[12px] print:shadow-none">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#1d765b]">{schoolName}</p>{motto && <p className="mt-2 italic text-[#64736d]">{motto}</p>}
      <div className="my-12 h-px w-32 bg-[#b99453]" />
      <p className="font-serif text-4xl font-semibold text-[#21372e]">Certificate of Achievement</p>
      <p className="mt-8 text-lg text-[#53645b]">This certificate is proudly presented to</p>
      <h2 className="mt-4 font-serif text-5xl font-semibold text-[#174f40]">{student.name}</h2>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[#53645b]">In recognition of dedication and achievement as a student in <span className="font-semibold">{student.gradeLevel}</span>.</p>
      <p className="mt-5 text-sm text-[#64736d]">Student number: {student.studentNumber}</p>
      <div className="mt-16 grid w-full max-w-2xl grid-cols-2 gap-12 text-sm text-[#53645b]"><div className="border-t border-[#b99453] pt-3">School Administrator</div><div className="border-t border-[#b99453] pt-3">Date</div></div>
    </article> : <p className="mt-8 rounded-xl border border-dashed border-[#cbd6cc] bg-white p-10 text-center text-sm text-[#64736d] print:hidden">Choose a student to preview their certificate.</p>}
    <style>{'@media print { body { background: white !important; } #certificate { break-inside: avoid; } } @page { size: landscape; margin: 12mm; }'}</style>
  </section>;
}
