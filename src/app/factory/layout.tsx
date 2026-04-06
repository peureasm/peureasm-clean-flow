
"use client"

import { Factory, Kanban, PackageCheck, List, ShieldAlert, Loader2, LogOut } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth, initiateSignOut } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function FactoryLayout({ children }: { children: React.ReactNode }) {
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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isUserDocLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        <p className="font-bold text-slate-400">사용자 권한 확인 중...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        <p className="font-bold text-slate-400">프로필 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 권한 체크
  if (userData.role !== 'FACTORY') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-8">
        <Card className="max-w-md w-full p-10 text-center space-y-6 rounded-[40px] border-none shadow-2xl bg-white">
          <div className="h-20 w-20 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 mx-auto border border-purple-100">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">공장 권한 없음</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              이 페이지는 <span className="text-purple-500 font-bold">공장 관리자</span> 권한이 필요합니다.<br/>
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
    <div className="min-h-screen bg-[#F8FAFC] font-body">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-8 shadow-sm">
        <Link href="/factory" className="flex items-center gap-2 font-bold text-purple-700">
          <Factory className="h-6 w-6" />
          <span className="text-xl tracking-tight">Clean-flow</span>
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
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-destructive rounded-full">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <main className="p-4 sm:p-8">
        {children}
      </main>
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
