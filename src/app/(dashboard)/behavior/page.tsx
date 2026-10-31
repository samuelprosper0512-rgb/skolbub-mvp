import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import BehaviorClient from './behavior-client';
export default async function BehaviorPage(){const s=await getSession();if(!s)redirect('/login');if(s.role!=='ADMIN'&&s.role!=='TEACHER')redirect('/dashboard');return <><h1 className="font-serif text-3xl font-semibold">Behavior and discipline</h1><p className="mt-2 text-sm text-[#64736d]">Record positive contributions and disciplinary events.</p><BehaviorClient/></>;}
