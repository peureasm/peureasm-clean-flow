
"use client"

import RoleSelector from '@/components/layout/RoleSelector';
import { Factory, Kanban, PackageCheck, List } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FactoryLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-8 shadow-sm">
        <Link href="/factory" className="flex items-center gap-2 font-bold text-purple-700">
          <Factory className="h-6 w-6" />
          <span className="text-xl tracking-tight">MediLaundry <span className="text-slate-800">Factory</span></span>
        </Link>
        <div className="ml-8 hidden md:flex gap-6 items-center">
          <NavLink href="/factory" icon={Kanban} label="공정 보드" active={pathname === '/factory'} />
          <NavLink href="/factory/inbound" icon={List} label="입고 대기" active={pathname === '/factory/inbound'} />
          <NavLink href="/factory/outbound" icon={PackageCheck} label="출고 준비" active={pathname === '/factory/outbound'} />
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{userData?.name || '공장 관리자'}</p>
            <p className="text-xs text-muted-foreground font-medium">경기 제1세탁센터</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border border-purple-200 shadow-inner">
            {userData?.name?.[0] || 'F'}
          </div>
        </div>
      </header>
      <main className="p-4 sm:p-8">
        {children}
      </main>
      <RoleSelector />
    </div>
  );
}

function NavLink({ href, icon: Icon, label, active = false }: any) {
  return (
    <Link href={href} className={`flex items-center gap-2 text-sm font-bold transition-colors ${active ? 'text-purple-700 underline decoration-2 underline-offset-8' : 'text-slate-500 hover:text-purple-600'}`}>
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
