
"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/app/lib/types';
import { Hospital, Truck, Factory, ShieldCheck, LogIn } from 'lucide-react';
import { useAuth, initiateAnonymousSignIn, useUser } from '@/firebase';

export default function RoleSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();

  const roles: { id: UserRole; label: string; icon: any; color: string }[] = [
    { id: 'HOSPITAL', label: '병원담당자', icon: Hospital, color: 'text-blue-600' },
    { id: 'DRIVER', label: '수거기사', icon: Truck, color: 'text-emerald-600' },
    { id: 'FACTORY', label: '공장관리', icon: Factory, color: 'text-purple-600' },
    { id: 'ADMIN', label: '총괄관리자', icon: ShieldCheck, color: 'text-slate-800' },
  ];

  const currentRole = pathname.split('/')[1]?.toUpperCase() as UserRole;

  const handleRoleSwitch = (roleId: UserRole) => {
    // 프로토타입 환경이므로 익명 로그인을 통해 세션을 유지합니다.
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
    router.push(`/${roleId.toLowerCase()}`);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-wrap gap-2 p-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50">
      <div className="w-full flex justify-between items-center px-2 mb-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
          역할 전환 (Firebase Auth 연동)
        </span>
        {user ? (
          <span className="text-[9px] text-emerald-600 font-bold">인증됨</span>
        ) : (
          <span className="text-[9px] text-orange-600 font-bold">미인증</span>
        )}
      </div>
      {roles.map((role) => (
        <Button
          key={role.id}
          variant={currentRole === role.id ? 'default' : 'outline'}
          size="sm"
          className="rounded-xl h-10 px-3 flex gap-2"
          onClick={() => handleRoleSwitch(role.id)}
        >
          <role.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{role.label}</span>
        </Button>
      ))}
      {!user && (
        <Button 
          variant="secondary" 
          size="sm" 
          className="rounded-xl h-10 px-3 bg-secondary/20"
          onClick={() => auth && initiateAnonymousSignIn(auth)}
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">로그인 테스트</span>
        </Button>
      )}
    </div>
  );
}
