"use client"

import RoleSelector from '@/components/layout/RoleSelector';
import { Truck, MapPin, History, Hospital, ShieldAlert, Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth, initiateSignOut } from '@/firebase';
import { doc } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
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

  // 1. 로딩 상태 처리
  if (isUserLoading || isUserDocLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="font-bold text-slate-400">사용자 권한 확인 중...</p>
      </div>
    );
  }

  // 2. 미인증 사용자 처리
  if (!user) {
    router.push('/login');
    return null;
  }

  // 3. 권한 체크 (DRIVER가 아닌 경우 차단)
  if (userData && userData.role !== 'DRIVER') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-8">
        <Card className="max-w-md w-full p-10 text-center space-y-6 rounded-[40px] border-none shadow-2xl bg-white">
          <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-100">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">기사 권한 없음</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              이 페이지는 <span className="text-emerald-500 font-bold">수거 기사</span> 권한이 필요합니다.<br/>
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

  const handleLogout = () => {
    if (auth) {
      initiateSignOut(auth);
      router.push('/');
    }
  };

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
          {userData && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-foreground">{userData.name || '기사님'}</p>
              <p className="text-[10px] text-muted-foreground font-bold tracking-tight uppercase">Field Logistics</p>
            </div>
          )}
          <div className="h-10 w-10 rounded-btn bg-secondary flex items-center justify-center text-white font-black shadow-lg shadow-secondary/20">
            {userData?.name?.[0] || 'D'}
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-destructive rounded-full">
            <LogOut className="h-5 w-5" />
          </Button>
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
