"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, LogOut } from "lucide-react";
import { useAuth, useUser, initiateSignOut } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PendingAccessPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, userData, isUserLoading } = useUser();

  // 라우팅은 렌더 중이 아니라 effect에서만 수행
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (userData?.role) {
      router.replace(`/${String(userData.role).toLowerCase()}`);
    }
  }, [isUserLoading, user, userData?.role, router]);

  const handleLogout = async () => {
    if (!auth) return;
    await initiateSignOut(auth);
    router.replace("/login");
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-lg rounded-[32px] border-none bg-white ring-1 ring-slate-200/50 shadow-xl">
          <CardContent className="p-10 text-center space-y-3">
            <p className="text-sm font-black text-slate-900">세션 확인 중...</p>
            <p className="text-xs text-slate-500 font-medium">잠시만 기다려 주세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 리다이렉트(effect) 처리 중에는 UI를 잠깐 숨김
  if (!user || userData?.role) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-body">
      <Card className="w-full max-w-lg rounded-[40px] border-none bg-white ring-1 ring-slate-200/50 shadow-2xl">
        <CardContent className="p-10 space-y-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">권한 승인 대기</h1>
              <p className="text-slate-500 font-medium leading-relaxed">
                계정은 생성되었지만, 아직 역할(병원/기사/공장/관리자)이 배정되지 않았습니다.
                <br />
                관리자가 권한을 부여하면 자동으로 해당 대시보드로 이동합니다.
              </p>
            {userData?.roleRequested && (
              <p className="text-xs font-black text-slate-700 pt-2">
                요청 역할: <span className="text-primary">{String(userData.roleRequested)}</span>
              </p>
            )}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 flex gap-3">
            <Clock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-800">다음 단계</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                관리자에게 계정 이메일(<span className="font-black">{user.email}</span>)을 전달하고 권한 배정을 요청해 주세요.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="h-12 rounded-2xl font-black w-full" onClick={() => router.refresh()}>
              새로고침
            </Button>
            <Button variant="destructive" className="h-12 rounded-2xl font-black w-full gap-2" onClick={handleLogout} style={{color: 'white'}}>
              <LogOut className="h-4 w-4" style={{color: 'white'}} /> 로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

