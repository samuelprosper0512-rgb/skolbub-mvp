'use client';

import { FormEvent, useEffect, useState } from 'react';

type Student = { id: string; name: string; studentNumber: string };
type Room = { id: string; roomNumber: string; capacity: number; assignments: { student: Student }[] };
type Hostel = { id: string; name: string; capacity: number; rooms: Room[] };

export default function HostelsAdmin() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/hostels');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load hostel information.');
    setHostels(data.hostels);
    setStudents(data.students);
  }

  useEffect(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load hostel information.')); }, []);

  async function submit(event: FormEvent<HTMLFormElement>, kind: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch('/api/hostels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, ...Object.fromEntries(new FormData(form).entries()) }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || 'Unable to save changes.'); return; }
    form.reset();
    setMessage('Changes saved.');
    await load();
  }

  const rooms = hostels.flatMap((hostel) => hostel.rooms.map((room) => ({ ...room, hostelName: hostel.name })));

  return <section><p className="text-sm font-semibold text-[#1d765b]">Boarding</p><h1 className="mt-1 font-serif text-3xl font-semibold">Hostels & rooms</h1>{message && <p role="status" className="mt-4 text-sm text-[#64736d]">{message}</p>}
    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      <form onSubmit={(event) => void submit(event, 'hostel')} className="space-y-3 rounded-xl border border-[#e1e8df] bg-white p-5"><h2 className="font-bold">Create hostel</h2><label className="block text-sm font-semibold">Name<input required name="name" className="mt-1 w-full rounded-lg border px-3 py-2" /></label><label className="block text-sm font-semibold">Capacity<input required name="capacity" type="number" min="1" className="mt-1 w-full rounded-lg border px-3 py-2" /></label><button className="rounded-lg bg-[#1d765b] px-4 py-2 text-sm font-bold text-white">Create</button></form>
      <form onSubmit={(event) => void submit(event, 'room')} className="space-y-3 rounded-xl border border-[#e1e8df] bg-white p-5"><h2 className="font-bold">Create room</h2><label className="block text-sm font-semibold">Hostel<select required name="hostelId" className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Select hostel</option>{hostels.map((hostel) => <option key={hostel.id} value={hostel.id}>{hostel.name}</option>)}</select></label><label className="block text-sm font-semibold">Room number<input required name="roomNumber" className="mt-1 w-full rounded-lg border px-3 py-2" /></label><label className="block text-sm font-semibold">Bed capacity<input required name="capacity" type="number" min="1" className="mt-1 w-full rounded-lg border px-3 py-2" /></label><button className="rounded-lg bg-[#1d765b] px-4 py-2 text-sm font-bold text-white">Create room</button></form>
      <form onSubmit={(event) => void submit(event, 'assign')} className="space-y-3 rounded-xl border border-[#e1e8df] bg-white p-5"><h2 className="font-bold">Assign student</h2><label className="block text-sm font-semibold">Student<select required name="studentId" className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.studentNumber})</option>)}</select></label><label className="block text-sm font-semibold">Room<select required name="roomId" className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Select room</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.hostelName} · {room.roomNumber} ({room.assignments.length}/{room.capacity})</option>)}</select></label><button className="rounded-lg bg-[#1d765b] px-4 py-2 text-sm font-bold text-white">Assign bed</button></form>
    </div>
    <div className="mt-6 space-y-4">{hostels.map((hostel) => <article key={hostel.id} className="rounded-xl border border-[#e1e8df] bg-white p-5"><h2 className="font-bold">{hostel.name} <span className="font-normal text-[#64736d]">· capacity {hostel.capacity}</span></h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{hostel.rooms.map((room) => <div key={room.id} className="rounded-lg bg-[#f5f7f1] p-4"><p className="font-semibold">Room {room.roomNumber} · {room.assignments.length}/{room.capacity}</p><p className="mt-2 text-sm text-[#64736d]">{room.assignments.map(({ student }) => student.name).join(', ') || 'No students assigned'}</p></div>)}</div></article>)}</div>
  </section>;
}
