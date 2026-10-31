import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import HealthClient from './health-client';
export default async function HealthPage(){const s=await getSession();if(!s)redirect('/login');if(s.role!=='ADMIN'&&s.role!=='TEACHER')redirect('/dashboard');return <><h1 className="font-serif text-3xl font-semibold">Health and medical records</h1><p className="mt-2 text-sm text-[#64736d]">Maintain confidential student medical profiles.</p><HealthClient/></>;}
