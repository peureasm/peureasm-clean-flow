"use client"

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, LogIn, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';

import { initiateEmailSignIn, initiateEmailSignUp, useAuth, useUser } from '@/firebase';
import type { UserRole } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'HOSPITAL', label: '병원' },
  { value: 'DRIVER', label: '기사' },
  { value: 'FACTORY', label: '공장' },
  { value: 'ADMIN', label: '관리자' },
];

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
        description: '권한을 확인한 뒤 화면으로 이동합니다.',
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
        description: '승인 대기 화면으로 이동합니다.',
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-bold">계정 상태를 확인하는 중입니다.</p>
      </div>
    );
  }

  if (user && userError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-8 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="max-w-md text-sm leading-6 text-slate-600">{userError.message}</p>
        <Button variant="outline" onClick={() => router.refresh()}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (user && !userData?.role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-bold">승인 상태를 확인하는 중입니다.</p>
      </div>
    );
  }

  if (user && userData?.role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-bold">대시보드로 이동하는 중입니다.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_12%,rgba(130,119,255,0.24),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(179,167,255,0.20),transparent_28%),linear-gradient(180deg,#f6f4ff_0%,#efebff_44%,#ece9ff_100%)] px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute left-[-100px] top-40 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-[-80px] top-12 h-64 w-64 rounded-full bg-violet-200/35 blur-3xl" />

      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-5">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
              Clean-Flow
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              권한 기반 자동 이동
            </div>
            <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-slate-900">
              로그인 한 번으로
              <span className="mt-2 block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                역할 화면까지 연결
              </span>
            </h1>
            <p className="text-base leading-7 text-slate-600">
              샘플 무드의 깔끔한 첫인상을 유지하면서, 실제 운영 로직은 그대로 연결됩니다.
            </p>

            <div className="space-y-3">
              {[
                '로그인 시 역할 대시보드로 자동 이동',
                '권한 미확정 계정은 승인 대기로 자동 분기',
                '초대 링크 접속 시 서버 검증 흐름 유지',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <Link href="/" className="text-lg font-black text-slate-900">
              Clean-Flow
            </Link>
            <Button asChild variant="ghost" className="px-2 text-slate-600">
              <Link href="/">
                초기화면
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Card className="rounded-[28px] border-white/70 bg-white/88 shadow-[0_28px_60px_-32px_rgba(76,61,140,0.45)] backdrop-blur">
            <CardContent className="space-y-6 p-6 sm:p-7">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Access
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">로그인 또는 계정 등록</h2>
                <p className="text-sm text-slate-600">권한 확인 후 알맞은 화면으로 자동 이동합니다.</p>
              </div>

              {inviteToken && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  초대 링크가 감지되었습니다. 같은 이메일 계정으로 진행해 주세요.
                </div>
              )}

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} className="w-full">
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
                  <TabsTrigger value="login" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary">
                    로그인
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary">
                    신규 등록
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-5">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-xs font-semibold text-slate-600">
                        이메일
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="hospital@example.com"
                        className="h-11 rounded-xl"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-xs font-semibold text-slate-600">
                        비밀번호
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="비밀번호"
                        className="h-11 rounded-xl"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-bold shadow-lg shadow-violet-300/35" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                      로그인
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-5">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-xs font-semibold text-slate-600">
                        이메일
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="hospital@example.com"
                        className="h-11 rounded-xl"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-xs font-semibold text-slate-600">
                        비밀번호
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="최소 6자 이상"
                        className="h-11 rounded-xl"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">요청 권한</Label>
                      <Select value={requestedRole} onValueChange={(value) => setRequestedRole(value as UserRole)}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="권한 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-bold shadow-lg shadow-violet-300/35" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      계정 등록
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
