import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import TransportClient from './transport-client';
export default async function TransportPage(){const s=await getSession();if(!s)redirect('/login');if(s.role!=='ADMIN')redirect('/dashboard');return <><h1 className="font-serif text-3xl font-semibold">Transport management</h1><p className="mt-2 text-sm text-[#64736d]">Create bus routes and assign students.</p><TransportClient/></>;}
