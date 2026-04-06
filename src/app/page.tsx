
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hospital, Loader2, LogIn, CheckCircle2, UserPlus, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const { user, userData, isUserLoading } = useUser();

  // 권한 기반 리다이렉션: 로그인 정보와 역할 데이터가 모두 로드되었을 때만 실행
  useEffect(() => {
    if (!isUserLoading && user && userData?.role) {
      router.push(`/${userData.role.toLowerCase()}`);
    }
    if (!isUserLoading && user && userData && !userData.role) {
      router.push('/pending');
    }
  }, [userData, isUserLoading, user, router]);

  // 인증 상태 확인 중이거나 리다이렉션 대기 중일 때 로딩 표시
  if (isUserLoading || (user && !userData?.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 animate-pulse flex items-center justify-center">
            <Hospital className="h-10 w-10 text-primary animate-bounce" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xl font-black text-slate-900 tracking-tight">보안 세션 인증 중</p>
          <p className="text-sm text-slate-400 font-bold">권한 데이터를 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <header className="h-20 bg-white border-b flex items-center justify-between px-6 sm:px-12 sticky top-0 z-30">
        <div className="flex items-center gap-2 font-bold text-primary">
          <div className="bg-primary text-white p-3 rounded-md shadow-primary/20">
            <Hospital className="h-6 w-6" />
          </div>
          <span className="text-2xl tracking-tighter font-black">Clean - <span className="text-secondary">Flow</span></span>
        </div>
        <div className="flex items-center gap-4">
          {!user ? (
            <Button asChild className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105">
              <Link href="/login"><LogIn className="h-4 w-4 mr-2" /> 시작하기</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-600 hidden sm:block">{user.email}</span>
              <Button asChild variant="outline" className="rounded-xl h-11 px-6 font-bold border-primary text-primary hover:bg-primary/5">
                <Link href={userData?.role ? `/${userData.role.toLowerCase()}` : '/login'}>대시보드 입장</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-16 max-w-6xl mx-auto py-20">
        <div className="text-center space-y-6 max-w-3xl">
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-slate-900 leading-[1.05]">
            병원의 세탁물 관리 <br/>
            <span className="text-primary decoration-secondary/30 decoration-8 underline-offset-4">더욱 투명해집니다</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            복잡한 수량 대조와 분실 이슈를 데이터로 해결하세요. 
            병원 담당자부터 수거 기사, 공장까지 하나의 Flow로 연결됩니다.
          </p>
        </div>

        {!user && (
          <div className="w-full max-w-4xl space-y-8">
            <div className="text-center space-y-3">
              <p className="text-lg font-black text-slate-900 tracking-tight">권한은 로그인 후 자동으로 적용됩니다.</p>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                계정에 부여된 권한(병원/기사/공장/관리자)에 따라 해당 대시보드로 자동 연결됩니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <Link href="/login">
                <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-none cursor-pointer overflow-hidden rounded-[32px] bg-white ring-1 ring-slate-200/50">
                  <CardContent className="p-10 flex items-center gap-8">
                    <div className="h-20 w-20 rounded-3xl bg-primary text-white flex items-center justify-center shrink-0 shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                      <LogIn className="h-10 w-10" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors">로그인</h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">부여된 권한으로 <br /> 대시보드에 접속합니다.</p>
                      <div className="pt-2">
                        <Button className="rounded-xl h-10 px-4 font-black gap-2 shadow-lg shadow-primary/20 group-hover:shadow-xl" tabIndex={-1}>
                          로그인 화면으로 <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/login?tab=signup">
                <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-none cursor-pointer overflow-hidden rounded-[32px] bg-white ring-1 ring-slate-200/50">
                  <CardContent className="p-10 flex items-center gap-8">
                    <div className="h-20 w-20 rounded-3xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xl shadow-emerald-200 group-hover:scale-110 transition-transform duration-500">
                      <UserPlus className="h-10 w-10" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">신규 등록</h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">계정을 만들고 <br /> 관리자에게 권한을 요청하세요.</p>
                      <div className="pt-2">
                        <Button variant="outline" className="rounded-xl h-10 px-4 font-black gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50" tabIndex={-1}>
                          계정 생성 <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}

        <div className="w-full pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-center items-center gap-6">
          <p className="text-slate-400 text-sm font-bold tracking-tight">
            © 2026 Clean-flow System. <span className="text-slate-300">All rights reserved.</span>
          </p>
        </div>
      </main>
    </div>
  );
}
