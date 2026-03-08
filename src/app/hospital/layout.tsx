
"use client"

import RoleSelector from '@/components/layout/RoleSelector';
import { Hospital, LayoutDashboard, ClipboardList, PlusCircle, Settings } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  // 1. 사용자 프로필 정보 조회
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  // 2. 사용자의 소속 병원 정보 조회
  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !userData?.hospitalId) return null;
    return doc(firestore, 'hospitals', userData.hospitalId);
  }, [firestore, userData?.hospitalId]);

  const { data: hospital } = useDoc(hospitalRef);

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6 shadow-sm">
        <Link href="/hospital" className="flex items-center gap-2 font-bold text-primary">
          <Hospital className="h-6 w-6" />
          <span className="text-xl tracking-tight">MediLaundry <span className="text-secondary">Hosp</span></span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{userData?.name || '담당자'}</p>
            <p className="text-xs text-muted-foreground">{hospital?.name || '소속 병원 확인 중'}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
            {userData?.name?.[0] || 'H'}
          </div>
        </div>
      </header>
      <main className="pb-24 sm:pb-8">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-white px-2 sm:hidden shadow-lg">
        <NavItem href="/hospital" icon={LayoutDashboard} label="홈" active={pathname === '/hospital'} />
        <NavItem href="/hospital/requests" icon={ClipboardList} label="내역" active={pathname === '/hospital/requests'} />
        <NavItem href="/hospital/new" icon={PlusCircle} label="요청" active={pathname === '/hospital/new'} />
        <NavItem href="/hospital/settings" icon={Settings} label="정보관리" active={pathname === '/hospital/settings'} />
      </nav>
      
      <RoleSelector />
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active = false }: any) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
      <Icon className="h-6 w-6" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
