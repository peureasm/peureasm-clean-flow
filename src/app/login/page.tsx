
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hospital, Loader2, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  // 이미 로그인된 사용자는 메인으로 리다이렉트
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    
    try {
      await initiateEmailSignIn(auth, email, password);
      toast({ title: "로그인 성공", description: "대시보드로 이동합니다." });
    } catch (error: any) {
      let message = "이메일 또는 비밀번호를 확인하세요.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "계정 정보가 일치하지 않습니다. 이메일과 비밀번호를 다시 확인해 주세요.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "너무 많은 로그인 시도가 감지되었습니다. 잠시 후 다시 시도해 주세요.";
      }
      
      toast({ 
        variant: "destructive", 
        title: "로그인 실패", 
        description: message 
      });
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    
    try {
      await initiateEmailSignUp(auth, email, password);
      toast({ title: "회원가입 성공", description: "계정이 생성되었습니다. 이제 로그인이 가능합니다." });
      // 가입 후 상태 업데이트로 인해 메인으로 이동하거나 탭을 전환할 수 있음
    } catch (error: any) {
      let message = "계정 생성에 실패했습니다. 다시 시도해 주세요.";
      if (error.code === 'auth/email-already-in-use') {
        message = "이미 사용 중인 이메일 주소입니다.";
      } else if (error.code === 'auth/weak-password') {
        message = "비밀번호가 너무 취약합니다 (6자 이상 필요).";
      } else if (error.code === 'auth/invalid-email') {
        message = "유효하지 않은 이메일 형식입니다.";
      }
      
      toast({ 
        variant: "destructive", 
        title: "가입 실패", 
        description: message 
      });
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-body">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-primary text-white p-3 rounded-2xl shadow-xl shadow-primary/20">
            <Hospital className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">MediLaundry Flow</h1>
          <p className="text-slate-500 font-medium">병원 세탁물 통합 관리 시스템</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100/50 p-1 rounded-none">
              <TabsTrigger value="login" className="font-bold data-[state=active]:bg-white data-[state=active]:text-primary rounded-none">로그인</TabsTrigger>
              <TabsTrigger value="signup" className="font-bold data-[state=active]:bg-white data-[state=active]:text-primary rounded-none">신규 등록</TabsTrigger>
            </TabsList>

            <CardContent className="p-8">
              <TabsContent value="login" className="m-0 space-y-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">이메일 계정</Label>
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="name@hospital.com" 
                      className="h-12 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <Input 
                      id="login-password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-12 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black gap-2 shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                    로그인
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="m-0 space-y-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일 계정</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="name@hospital.com" 
                      className="h-12 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호 설정</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      placeholder="6자 이상 입력" 
                      className="h-12 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black gap-2 shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                    계정 생성하기
                  </Button>
                </form>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    가입 후 관리자로부터 병원 또는 기사 권한을 승인받아야 시스템 이용이 가능합니다.
                  </p>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-slate-400 font-medium">
          계정 분실 시 시스템 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}
