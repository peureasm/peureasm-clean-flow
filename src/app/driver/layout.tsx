
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

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading } = useDoc(userDocRef);

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <Link href="/driver" className="flex items-center gap-3 font-black text-secondary">
          <div className="p-1.5 bg-secondary rounded-lg shadow-lg shadow-secondary/20">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl tracking-tighter text-foreground">MediLaundry <span className="text-secondary">Driver</span></span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {!isLoading && userData && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-foreground">{userData.name || '기사님'}</p>
              <p className="text-[10px] text-muted-foreground font-bold tracking-tight uppercase">Field Logistics</p>
            </div>
          )}
          <div className="h-10 w-10 rounded-btn bg-secondary flex items-center justify-center text-white font-black shadow-lg shadow-secondary/20">
            {userData?.name?.[0] || 'D'}
          </div>
        </div>
      </header>
      
      <main className="pb-24 sm:pb-8 max-w-lg mx-auto min-h-[calc(100vh-64px)] animate-in fade-in duration-500">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-white/95 backdrop-blur-md px-2 sm:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <NavItem href="/driver" icon={MapPin} label="배정목록" active={pathname === '/driver'} isSecondary />
        <NavItem href="/driver/hospitals" icon={Hospital} label="거점관리" active={pathname.startsWith('/driver/hospitals')} isSecondary />
        <NavItem href="/driver/history" icon={History} label="이력조회" active={pathname === '/driver/history'} isSecondary />
      </nav>
      
      <RoleSelector />
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active, isSecondary }: any) {
  const activeColor = isSecondary ? 'text-secondary' : 'text-primary';
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 p-2 transition-all ${active ? `${activeColor} font-black scale-110` : 'text-muted-foreground hover:text-foreground'}`}>
      <Icon className={`h-5 w-5 ${active ? 'fill-current opacity-20' : ''}`} />
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );
}
