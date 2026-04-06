
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp, initiateAnonymousSignIn } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hospital, Loader2, LogIn, UserPlus, ShieldCheck, Sparkles, ArrowRight, CheckCircle2, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    if (password.length < 6) {
      toast({ variant: "destructive", title: "입력 오류", description: "비밀번호는 최소 6자 이상이어야 합니다." });
      return;
    }

    setIsLoading(true);
    try {
      await initiateEmailSignIn(auth, email, password);
      toast({ title: "로그인 성공", description: "대시보드로 안전하게 연결되었습니다." });
    } catch (error: any) {
      let message = "이메일 또는 비밀번호를 확인하세요.";
      if (error.code === 'auth/invalid-credential') {
        message = "등록되지 않은 계정이거나 비밀번호가 틀립니다. '신규 등록' 탭에서 계정을 생성해 주세요.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "너무 많은 시도가 발생했습니다. 잠시 후 다시 시도하세요.";
      }
      
      toast({ variant: "destructive", title: "로그인 실패", description: message });
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    
    try {
      await initiateEmailSignUp(auth, email, password);
      toast({ title: "회원가입 완료", description: "계정이 생성되었습니다. 이제 바로 서비스를 이용하실 수 있습니다." });
    } catch (error: any) {
      let message = "가입 중 오류가 발생했습니다.";
      if (error.code === 'auth/email-already-in-use') message = "이미 등록된 이메일 주소입니다.";
      else if (error.code === 'auth/weak-password') message = "비밀번호가 너무 취약합니다.";
      
      toast({ variant: "destructive", title: "가입 실패", description: message });
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await initiateAnonymousSignIn(auth);
      toast({ title: "게스트 접속 성공", description: "체험 모드로 입장합니다. 왼쪽 하단 아이콘으로 권한을 변경해 보세요." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "접속 실패", description: "게스트 접속 중 문제가 발생했습니다." });
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-bold text-slate-400 animate-pulse">보안 세션 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-body bg-white">
      {/* Left: Branding & Visual */}
      <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 opacity-40">
          <Image 
            src="https://picsum.photos/seed/medilaundry_login/1200/800" 
            alt="Hospital background" 
            fill 
            className="object-cover"
            data-ai-hint="hospital building"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-slate-900/90" />
        
        <div className="relative z-10 max-w-lg space-y-8 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Medical Grade Security</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight leading-[1.1]">
              투명한 세탁물 관리,<br/>
              <span className="text-emerald-400 underline decoration-emerald-400/30">디지털 워크플로우</span>로.
            </h1>
            <p className="text-lg text-slate-300 font-medium leading-relaxed">
              Clean-flow는 병원, 물류, 공장을 하나의 실시간 네트워크로 연결하여 오차 없는 자산 관리를 실현합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="space-y-2">
              <p className="text-3xl font-black text-emerald-400">100%</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Real-time Tracking</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-black text-emerald-400">Zero</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Paper Workflow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-slate-50/50">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center space-y-3 lg:items-start lg:text-left">
            <div className="bg-primary text-white p-3 rounded-2xl shadow-xl shadow-primary/20 lg:hidden">
              <Hospital className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">시작하기</h2>
              <p className="text-slate-500 font-medium">관리 시스템에 접근하기 위해 로그인하세요.</p>
            </div>
          </div>

          <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white ring-1 ring-slate-200/50">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100/50 p-1 rounded-none">
                <TabsTrigger value="login" className="font-bold data-[state=active]:bg-white data-[state=active]:text-primary rounded-none transition-all">로그인</TabsTrigger>
                <TabsTrigger value="signup" className="font-bold data-[state=active]:bg-white data-[state=active]:text-primary rounded-none transition-all">신규 등록</TabsTrigger>
              </TabsList>

              <CardContent className="p-8 space-y-6">
                <TabsContent value="login" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">이메일 계정</Label>
                      <Input 
                        id="login-email" 
                        type="email" 
                        placeholder="hospital@example.com" 
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold focus:ring-2 focus:ring-primary/20"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <Label htmlFor="login-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">비밀번호</Label>
                        <Button variant="link" className="text-[10px] p-0 h-auto font-bold text-primary" type="button">비밀번호 찾기</Button>
                      </div>
                      <Input 
                        id="login-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold focus:ring-2 focus:ring-primary/20"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                      시스템 접속
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="m-0 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">이메일 계정</Label>
                      <Input 
                        id="signup-email" 
                        type="email" 
                        placeholder="hospital@example.com" 
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">비밀번호 설정</Label>
                      <Input 
                        id="signup-password" 
                        type="password" 
                        placeholder="최소 6자 이상" 
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black gap-2 shadow-xl shadow-primary/20" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                      계정 생성하기
                    </Button>
                  </form>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      가입 완료 후, 즉시 서비스를 이용하실 수 있습니다. 체험을 원하시면 아래의 <span className="font-bold text-primary">게스트 접속</span>을 이용해 보세요.
                    </p>
                  </div>
                </TabsContent>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase"><span className="bg-white px-2 text-slate-300 tracking-widest">Or test without account</span></div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl font-black gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary transition-all"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 text-primary" />}
                  게스트로 즉시 체험하기
                </Button>
              </CardContent>
            </Tabs>
          </Card>

          <div className="flex flex-col items-center gap-4 pt-4">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Powered by Clean-flow System</p>
            <div className="flex gap-6">
              <Button variant="link" className="text-[10px] text-slate-400 font-bold p-0">이용약관</Button>
              <Button variant="link" className="text-[10px] text-slate-400 font-bold p-0">개인정보처리방침</Button>
              <Button variant="link" className="text-[10px] text-slate-400 font-bold p-0">고객센터</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
