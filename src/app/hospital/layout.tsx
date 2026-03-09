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

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !userData?.hospitalId) return null;
    return doc(firestore, 'hospitals', userData.hospitalId);
  }, [firestore, userData?.hospitalId]);

  const { data: hospital } = useDoc(hospitalRef);

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <Link href="/hospital" className="flex items-center gap-3 font-black text-primary">
          <div className="p-1.5 bg-primary rounded-lg">
            <Hospital className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl tracking-tighter">MediLaundry <span className="text-muted-foreground font-medium">Hosp</span></span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {!isUserLoading && userData && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-foreground">{userData.name || '담당자'}</p>
              <p className="text-[10px] text-muted-foreground font-bold tracking-tight">{hospital?.name || '병원명 로딩 중'}</p>
            </div>
          )}
          <div className="h-10 w-10 rounded-btn bg-accent flex items-center justify-center text-primary font-black shadow-inner">
            {userData?.name?.[0] || 'H'}
          </div>
        </div>
      </header>
      <main className="pb-24 sm:pb-8">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-white/95 backdrop-blur-md px-2 sm:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <NavItem href="/hospital" icon={LayoutDashboard} label="홈" active={pathname === '/hospital'} />
        <NavItem href="/hospital/requests" icon={ClipboardList} label="내역" active={pathname === '/hospital/requests'} />
        <NavItem href="/hospital/new" icon={PlusCircle} label="신청" active={pathname === '/hospital/new'} />
        <NavItem href="/hospital/settings" icon={Settings} label="관리" active={pathname === '/hospital/settings'} />
      </nav>
      
      <RoleSelector />
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active = false }: any) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
      <Icon className={`h-6 w-6 ${active ? 'fill-primary/10' : ''}`} />
      <span className="text-[10px] font-black">{label}</span>
    </Link>
  );
}