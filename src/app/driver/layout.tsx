
"use client"

import RoleSelector from '@/components/layout/RoleSelector';
import { Truck, MapPin, History, Hospital } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  // 현재 로그인한 사용자의 Firestore 프로필 실시간 구독
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading } = useDoc(userDocRef);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-50 font-body">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-slate-900 px-4 sm:px-6 shadow-xl">
        <Link href="/driver" className="flex items-center gap-2 font-bold text-secondary">
          <Truck className="h-6 w-6" />
          <span className="text-xl tracking-tight">MediLaundry <span className="text-white">Driver</span></span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {!isLoading && userData && (
            <div className="text-right hidden sm:block animate-in fade-in duration-500">
              <p className="text-sm font-bold text-white">{userData.name || '기사님'}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">수거 및 운송 담당</p>
            </div>
          )}
          <div className="h-10 w-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary font-black border border-secondary/30">
            {userData?.name?.[0] || 'D'}
          </div>
        </div>
      </header>
      <main className="pb-24 sm:pb-8 max-w-lg mx-auto bg-slate-900 min-h-[calc(100vh-64px)] shadow-2xl border-x border-white/5">
        {children}
      </main>
      
      {/* Driver Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/10 bg-slate-900/95 backdrop-blur-lg px-2 sm:hidden shadow-2xl">
        <NavItem href="/driver" icon={MapPin} label="오늘의경로" active={pathname === '/driver'} />
        <NavItem href="/driver/hospitals" icon={Hospital} label="내 병원" active={pathname.startsWith('/driver/hospitals')} />
        <NavItem href="/driver/history" icon={History} label="수거이력" active={pathname === '/driver/history'} />
      </nav>
      
      <RoleSelector />
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-secondary font-black' : 'text-slate-400 hover:text-white'}`}>
      <Icon className={`h-5 w-5 ${active ? 'animate-pulse' : ''}`} />
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}
