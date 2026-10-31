import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LibraryClient from './library-client';
export default async function LibraryPage(){const session=await getSession();if(!session)redirect('/login');if(session.role!=='ADMIN')redirect('/dashboard');return <><h1 className="font-serif text-3xl font-semibold">Library management</h1><p className="mt-2 text-sm text-[#64736d]">Manage books, loans, and returns.</p><LibraryClient/></>;}
