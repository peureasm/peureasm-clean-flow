
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Hospital, Truck, Factory, ShieldCheck, ChevronRight, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const { user, userData, isUserLoading } = useUser();

  // 사용자의 실제 권한 데이타(userData.role)에 따라 대시보드로 자동 이동
  useEffect(() => {
    if (!isUserLoading && user && userData?.role) {
      router.push(`/${userData.role.toLowerCase()}`);
    }
  }, [userData, isUserLoading, user, router]);

  const roles = [
    { id: 'hospital', label: '병원 담당자', desc: '세탁물 수거 요청 및 납품 확인', icon: Hospital, color: 'bg-blue-500' },
    { id: 'driver', label: '수거 기사', desc: '현장 수량 확인 및 수거/납품 관리', icon: Truck, color: 'bg-emerald-500' },
    { id: 'factory', label: '공장 관리', desc: '입고 관리 및 세탁 공정 모니터링', icon: Factory, color: 'bg-purple-500' },
    { id: 'admin', label: '시스템 관리자', desc: '분쟁 조율, 통계 및 정산 관리', icon: ShieldCheck, color: 'bg-slate-800' },
  ];

  // 로그인 상태인데 아직 권한 데이터가 로딩 중이거나 리다이렉트 전인 경우 로딩 표시
  if (isUserLoading || (user && !userData?.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-slate-400">사용자 권한 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <header className="h-20 bg-white border-b flex items-center justify-between px-6 sm:px-12">
        <div className="flex items-center gap-2 font-bold text-primary">
          <div className="bg-primary text-white p-1.5 rounded-lg">
            <Hospital className="h-6 w-6" />
          </div>
          <span className="text-2xl tracking-tight">MediLaundry <span className="text-secondary">Flow</span></span>
        </div>
        <div className="flex items-center gap-4">
          {!user ? (
            <Button asChild className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20">
              <Link href="/login"><LogIn className="h-4 w-4 mr-2" /> 시작하기</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-600 hidden sm:block">{user.email}</span>
              <Button asChild variant="outline" className="rounded-xl h-11 px-6 font-bold border-primary text-primary hover:bg-primary/5">
                <Link href={userData?.role ? `/${userData.role.toLowerCase()}` : '/login'}>대시보드로 가기</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 max-w-5xl mx-auto py-20">
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
            신뢰할 수 있는 <span className="text-primary underline decoration-secondary decoration-4">세탁물 관리</span>의 시작
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            RFID 없이도 완벽한 수량 대조와 이력 관리. 
            병원-기사-공장을 잇는 투명한 스마트 워크플로우를 경험하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {roles.map((role) => (
            <Link key={role.id} href={user ? `/${role.id}` : '/login'}>
              <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none cursor-pointer overflow-hidden rounded-3xl bg-white">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className={`h-16 w-16 rounded-2xl ${role.color} text-white flex items-center justify-center shrink-0 shadow-lg`}>
                    <role.icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{role.label}</h3>
                    <p className="text-sm text-slate-500">{role.desc}</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="pt-8 text-slate-400 text-sm font-medium">
          © 2024 MediLaundry Flow System. All rights reserved.
        </div>
      </main>
    </div>
  );
}
