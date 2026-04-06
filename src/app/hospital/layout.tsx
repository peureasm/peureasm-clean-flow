
"use client"

import { Hospital, LayoutDashboard, ClipboardList, PlusCircle, Settings, ShieldAlert, Loader2, LogOut } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth, initiateSignOut } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !userData?.hospitalId) return null;
    return doc(firestore, 'hospitals', userData.hospitalId);
  }, [firestore, userData?.hospitalId]);

  const { data: hospital } = useDoc(hospitalRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isUserDocLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-slate-400">사용자 권한 확인 중...</p>
      </div>
    );
  }

  // 권한 체크
  if (userData && userData.role !== 'HOSPITAL') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-8">
        <Card className="max-w-md w-full p-10 text-center space-y-6 rounded-[40px] border-none shadow-2xl bg-white">
          <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mx-auto border border-blue-100">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">병원 권한 없음</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              이 페이지는 <span className="text-blue-500 font-bold">병원 담당자</span> 권한이 필요합니다.<br/>
              현재 '{userData.role}' 권한으로는 접근할 수 없습니다.
            </p>
          </div>
          <Button asChild className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold">
            <Link href="/">메인으로 돌아가기</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    if (auth) {
      await initiateSignOut(auth);
      router.push('/login');
    }
  };

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
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-foreground">{userData?.name || '담당자'}</p>
            <p className="text-[10px] text-muted-foreground font-bold tracking-tight">{hospital?.name || '병원 정보 없음'}</p>
          </div>
          <div className="h-10 w-10 rounded-btn bg-accent flex items-center justify-center text-primary font-black shadow-inner">
            {userData?.name?.[0] || 'H'}
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-destructive rounded-full">
            <LogOut className="h-5 w-5" />
          </Button>
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
