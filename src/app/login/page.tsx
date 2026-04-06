"use client"

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  Hospital,
  Loader2,
  LogIn,
  ShieldCheck,
  Truck,
  UserCog,
  UserPlus,
} from 'lucide-react';

import { initiateEmailSignIn, initiateEmailSignUp, useAuth, useUser } from '@/firebase';
import type { UserRole } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const roleOptions: Array<{ value: UserRole; label: string; description: string; icon: typeof Hospital }> = [
  { value: 'HOSPITAL', label: '병원', description: '수거 요청과 납품 확인을 담당합니다.', icon: Hospital },
  { value: 'DRIVER', label: '기사', description: '담당 병원 방문과 수거·배송 처리를 담당합니다.', icon: Truck },
  { value: 'FACTORY', label: '공장', description: '입고 처리와 수량 관리, 차이 대응을 담당합니다.', icon: Factory },
  { value: 'ADMIN', label: '관리자', description: '권한 승인과 배정, 정산 운영을 담당합니다.', icon: UserCog },
];

const loginHighlights = [
  '로그인 후 권한에 맞는 대시보드로 자동 이동합니다.',
  '권한이 아직 없으면 승인 대기 화면으로 연결됩니다.',
  '초대 링크로 접속한 경우 서버 검증 기반으로 승인 흐름이 이어집니다.',
] as const;

const processSteps = [
  {
    title: '1. 계정 생성 또는 로그인',
    detail: '병원, 기사, 공장, 관리자 계정 모두 동일한 진입 화면에서 시작합니다.',
  },
  {
    title: '2. 권한 요청 또는 초대 확인',
    detail: '회원가입 시 필요한 역할을 요청하거나, 초대 링크 기준으로 연결됩니다.',
  },
  {
    title: '3. 역할별 화면 자동 진입',
    detail: '승인 완료 후에는 해당 역할 화면으로 바로 이동합니다.',
  },
] as const;

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, userData, isUserLoading, userError } = useUser();

  const inviteToken = searchParams.get('inviteToken');
  const requestedTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(requestedTab === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('HOSPITAL');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setActiveTab(requestedTab === 'signup' ? 'signup' : 'login');
  }, [requestedTab]);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) return;

    if (userData?.role) {
      router.replace(`/${userData.role.toLowerCase()}`);
      return;
    }

    if (userData && !userData.role) {
      router.replace(inviteToken ? `/pending?inviteToken=${encodeURIComponent(inviteToken)}` : '/pending');
    }
  }, [inviteToken, isUserLoading, router, user, userData]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!auth) return;

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '비밀번호는 최소 6자 이상이어야 합니다.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await initiateEmailSignIn(auth, email, password);
      toast({
        title: '로그인 완료',
        description: '계정 권한을 확인한 뒤 알맞은 화면으로 이동합니다.',
      });
    } catch (error: any) {
      let message = '이메일 또는 비밀번호를 다시 확인해 주세요.';

      if (error.code === 'auth/invalid-credential') {
        message = '등록되지 않은 계정이거나 비밀번호가 올바르지 않습니다.';
      } else if (error.code === 'auth/too-many-requests') {
        message = '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
      }

      toast({
        variant: 'destructive',
        title: '로그인 실패',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!auth) return;

    setIsLoading(true);
    try {
      await initiateEmailSignUp(auth, email, password);
      toast({
        title: '계정 생성 완료',
        description: '권한 승인 절차를 위해 대기 화면으로 이동합니다.',
      });

      if (inviteToken) {
        router.replace(`/pending?inviteToken=${encodeURIComponent(inviteToken)}`);
      } else {
        router.replace(`/pending?requestedRole=${requestedRole}`);
      }
    } catch (error: any) {
      let message = '가입 처리 중 오류가 발생했습니다.';

      if (error.code === 'auth/email-already-in-use') {
        message = '이미 등록된 이메일 주소입니다.';
      } else if (error.code === 'auth/weak-password') {
        message = '비밀번호가 너무 약합니다. 더 안전한 비밀번호를 입력해 주세요.';
      }

      toast({
        variant: 'destructive',
        title: '회원가입 실패',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="space-y-1 text-center">
          <p className="text-xl font-black tracking-tight">계정과 권한 상태를 확인하는 중입니다.</p>
          <p className="text-sm text-slate-300">잠시만 기다리면 알맞은 화면으로 자동 연결됩니다.</p>
        </div>
      </div>
    );
  }

  if (user && userError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="space-y-1">
          <p className="text-xl font-black tracking-tight text-slate-950">사용자 정보를 불러오지 못했습니다.</p>
          <p className="max-w-md text-sm leading-6 text-slate-500">{userError.message}</p>
        </div>
        <Button variant="outline" onClick={() => router.refresh()}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (user && !userData?.role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="space-y-1 text-center">
          <p className="text-xl font-black tracking-tight">권한 승인 상태를 확인하는 중입니다.</p>
          <p className="text-sm text-slate-300">최초 로그인 계정은 승인 대기 화면으로 연결될 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (user && userData?.role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-black tracking-tight">권한에 맞는 대시보드로 이동하는 중입니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(78,93,234,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#0f172a_0%,_#111827_18%,_#f5f7fb_18%,_#eef2f7_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-8">
        <section className="flex flex-col justify-between rounded-[36px] border border-white/10 bg-slate-950/80 p-7 text-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.9)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                  <Hospital className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">Clean-Flow</p>
                  <p className="text-xs font-semibold text-slate-400">병원 세탁물 운영 통합 플랫폼</p>
                </div>
              </div>
              <Button asChild variant="ghost" className="rounded-2xl border border-white/10 bg-white/5 px-4 text-white hover:bg-white/10">
                <a href="/">초기화면</a>
              </Button>
            </div>

            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                권한 기반 자동 분기와 서버 검증 초대 흐름
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  로그인 한 번으로
                  <span className="block bg-gradient-to-r from-primary via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
                    역할에 맞는 운영 화면으로 연결됩니다
                  </span>
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  병원 요청 등록, 기사 배정, 공장 처리, 관리자 정산까지 현재 시스템에 맞는 흐름으로
                  계정 권한을 분기하고 운영 화면을 연결합니다.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {loginHighlights.map((item) => (
                <div key={item} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <p className="mt-3 text-sm leading-6 text-slate-200">{item}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <p className="text-lg font-black">처음 사용하는 경우 진행 순서</p>
              </div>
              <div className="mt-5 space-y-4">
                {processSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-4 rounded-[24px] border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-white">{step.title}</p>
                      <p className="text-sm leading-6 text-slate-300">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 pt-8 sm:grid-cols-2">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.value} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-white">{role.label}</p>
                      <p className="text-xs text-slate-400">{role.value}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{role.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <Card className="w-full max-w-xl rounded-[36px] border-white/70 bg-white/92 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <CardContent className="space-y-8 p-7 sm:p-8 lg:p-9">
              <div className="space-y-3">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Access</p>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-slate-950">로그인 또는 계정 등록</h2>
                  <p className="text-sm leading-6 text-slate-500">
                    로그인 후에는 권한별 대시보드로 이동하고, 계정이 없으면 역할 요청과 함께 등록할 수 있습니다.
                  </p>
                </div>
              </div>

              {inviteToken && (
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  <p className="font-black">초대 링크로 접속했습니다.</p>
                  <p className="mt-1">가입 또는 로그인 후 초대 검증 절차가 이어집니다. 초대 대상 이메일과 동일한 계정으로 진행해 주세요.</p>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} className="w-full">
                <TabsList className="grid h-14 w-full grid-cols-2 rounded-2xl bg-slate-100 p-1">
                  <TabsTrigger value="login" className="rounded-xl font-black data-[state=active]:bg-white data-[state=active]:text-primary">
                    로그인
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-xl font-black data-[state=active]:bg-white data-[state=active]:text-primary">
                    신규 등록
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6 space-y-6">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="ml-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        이메일 계정
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="hospital@example.com"
                        className="h-13 rounded-2xl border-slate-200 bg-slate-50 font-semibold"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <Label htmlFor="login-password" className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          비밀번호
                        </Label>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        className="h-13 rounded-2xl border-slate-200 bg-slate-50 font-semibold"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="h-14 w-full rounded-2xl text-base font-black shadow-xl shadow-primary/20" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                      로그인하고 계속하기
                    </Button>
                  </form>

                  <div className="rounded-[24px] bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-900">로그인 후 자동으로 처리되는 항목</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
                      <li>권한이 있으면 해당 역할 대시보드로 바로 이동</li>
                      <li>권한이 없으면 승인 대기 화면으로 자동 이동</li>
                      <li>초대 링크가 있으면 이후 승인 검증 단계에 반영</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="mt-6 space-y-6">
                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="ml-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        이메일 계정
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="hospital@example.com"
                        className="h-13 rounded-2xl border-slate-200 bg-slate-50 font-semibold"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="ml-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        비밀번호 설정
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="최소 6자 이상 입력하세요"
                        className="h-13 rounded-2xl border-slate-200 bg-slate-50 font-semibold"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="ml-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">요청 권한</Label>
                      <Select value={requestedRole} onValueChange={(value) => setRequestedRole(value as UserRole)}>
                        <SelectTrigger className="h-13 rounded-2xl border-slate-200 bg-slate-50 font-black">
                          <SelectValue placeholder="권한을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm leading-6 text-slate-500">
                        선택한 권한은 요청 상태로 등록되며, 실제 접근 권한은 관리자 승인 후 적용됩니다.
                      </p>
                    </div>

                    <Button type="submit" className="h-14 w-full rounded-2xl text-base font-black shadow-xl shadow-primary/20" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                      계정 등록 요청하기
                    </Button>
                  </form>

                  <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-600">
                    <p className="font-black text-slate-900">가입 후 진행 흐름</p>
                    <p className="mt-2">
                      계정 생성 후에는 승인 대기 화면으로 이동하며, 관리자 승인 완료 시 요청한 역할 대시보드에 접속할 수 있습니다.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>권한 기반 자동 분기와 승인 대기 흐름을 함께 지원합니다.</p>
                <Button asChild variant="link" className="h-auto p-0 font-black text-primary">
                  <a href="/">
                    초기화면으로 돌아가기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
