
"use client"

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/app/lib/types';
import { Hospital, Truck, Factory, ShieldCheck, LogIn } from 'lucide-react';
import { useAuth, useFirestore, initiateAnonymousSignIn, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

export default function RoleSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const roles: { id: UserRole; label: string; icon: any; color: string }[] = [
    { id: 'HOSPITAL', label: '병원담당자', icon: Hospital, color: 'text-blue-600' },
    { id: 'DRIVER', label: '수거기사', icon: Truck, color: 'text-emerald-600' },
    { id: 'FACTORY', label: '공장관리', icon: Factory, color: 'text-purple-600' },
    { id: 'ADMIN', label: '총괄관리자', icon: ShieldCheck, color: 'text-slate-800' },
  ];

  const currentPathRole = pathname.split('/')[1]?.toUpperCase() as UserRole;

  // 자동 익명 로그인 및 초기 프로필 생성
  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  // 사용자가 로그인되었을 때 기본 프로필이 없으면 생성
  useEffect(() => {
    if (user && firestore && currentPathRole) {
      const userRef = doc(firestore, 'users', user.uid);
      // 기존 프로필이 없을 수 있으므로 기본값 설정 (이미 있으면 merge됨)
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        username: user.email || `user_${user.uid.slice(0, 5)}`,
        name: user.displayName || '테스트 사용자',
        role: currentPathRole,
        hospitalId: currentPathRole === 'HOSPITAL' ? 'h1' : null,
        isActive: true,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
  }, [user, firestore, currentPathRole]);

  const handleRoleSwitch = (roleId: UserRole) => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userRef, {
        role: roleId,
        hospitalId: roleId === 'HOSPITAL' ? 'h1' : null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    router.push(`/${roleId.toLowerCase()}`);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-wrap gap-2 p-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50">
      <div className="w-full flex justify-between items-center px-2 mb-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
          역할 전환 (Firestore 권한 연동)
        </span>
        {user ? (
          <span className="text-[9px] text-emerald-600 font-bold">인증됨 ({user.uid.slice(0, 5)}...)</span>
        ) : (
          <span className="text-[9px] text-orange-600 font-bold">인증 대기 중</span>
        )}
      </div>
      {roles.map((role) => (
        <Button
          key={role.id}
          variant={currentPathRole === role.id ? 'default' : 'outline'}
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
