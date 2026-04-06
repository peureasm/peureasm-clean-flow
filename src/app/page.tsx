
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Hospital, Truck, Factory, ShieldCheck, ChevronRight, Loader2, LogIn, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const { user, userData, isUserLoading } = useUser();
  const { toast } = useToast();

  // 권한 기반 리다이렉션: 로그인 정보와 역할 데이터가 모두 로드되었을 때만 실행
  useEffect(() => {
    if (!isUserLoading && user && userData?.role) {
      router.push(`/${userData.role.toLowerCase()}`);
    }
  }, [userData, isUserLoading, user, router]);

  const roles = [
    { id: 'hospital', label: '병원 담당자', desc: '세탁물 수거 요청 및 실시간 공정 추적', icon: Hospital, color: 'bg-blue-500' },
    { id: 'driver', label: '수거 기사', desc: '현장 수량 검수 및 물류 운송 관리', icon: Truck, color: 'bg-emerald-500' },
    { id: 'factory', label: '공장 관리', desc: '스마트 세탁 공정 제어 및 입출고 관리', icon: Factory, color: 'bg-purple-500' },
    { id: 'admin', label: '시스템 관리자', desc: '분쟁 조율, 데이터 분석 및 정산 총괄', icon: ShieldCheck, color: 'bg-slate-800' },
  ];

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
          <div className="bg-primary text-white p-1.5 rounded-lg shadow-lg shadow-primary/20">
            <Hospital className="h-6 w-6" />
          </div>
          <span className="text-2xl tracking-tighter font-black">MediLaundry <span className="text-secondary">Flow</span></span>
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100 mb-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Digital Healthcare Logistics</span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-slate-900 leading-[1.05]">
            병원의 세탁물 관리가 <br/>
            <span className="text-primary underline decoration-secondary/30 decoration-8 underline-offset-4">더욱 투명해집니다.</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            복잡한 수량 대조와 분실 이슈를 데이터로 해결하세요. 
            병원 담당자부터 수거 기사, 공장까지 하나의 Flow로 연결됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {roles.map((role) => (
            <Link
              key={role.id}
              href={user ? `/${role.id}` : '/login'}
              onClick={(e) => {
                if (!user || !userData?.role) return;
                if (userData.role.toLowerCase() !== role.id) {
                  e.preventDefault();
                  toast({
                    variant: 'destructive',
                    title: '접근 권한 없음',
                    description: `이 계정의 권한은「${userData.role}」입니다. 배정된 역할의 대시보드만 이용할 수 있습니다.`,
                  });
                }
              }}
            >
              <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-none cursor-pointer overflow-hidden rounded-[32px] bg-white ring-1 ring-slate-200/50">
                <CardContent className="p-10 flex items-center gap-8">
                  <div className={`h-20 w-20 rounded-3xl ${role.color} text-white flex items-center justify-center shrink-0 shadow-2xl shadow-${role.id}/20 group-hover:scale-110 transition-transform duration-500`}>
                    <role.icon className="h-10 w-10" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors">{role.label}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{role.desc}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="w-full pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-sm font-bold tracking-tight">
            © 2024 Clean-flow System. <span className="text-slate-300">All rights reserved.</span>
          </p>
          <div className="flex gap-8">
            <Button variant="link" className="text-xs text-slate-400 font-bold p-0">Service Guide</Button>
            <Button variant="link" className="text-xs text-slate-400 font-bold p-0">Privacy Policy</Button>
            <Button variant="link" className="text-xs text-slate-400 font-bold p-0">Contact Admin</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
