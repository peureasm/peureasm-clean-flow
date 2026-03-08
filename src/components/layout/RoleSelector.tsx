
"use client"

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/app/lib/types';
import { Hospital, Truck, Factory, ShieldCheck, LogIn, ChevronUp, ChevronDown, GripVertical, X, Sparkles } from 'lucide-react';
import { useAuth, useFirestore, initiateAnonymousSignIn, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function RoleSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const roles: { id: UserRole; label: string; icon: any; color: string }[] = [
    { id: 'HOSPITAL', label: '병원담당자', icon: Hospital, color: 'text-blue-600' },
    { id: 'DRIVER', label: '수거기사', icon: Truck, color: 'text-emerald-600' },
    { id: 'FACTORY', label: '공장관리', icon: Factory, color: 'text-purple-600' },
    { id: 'ADMIN', label: '총괄관리자', icon: ShieldCheck, color: 'text-slate-800' },
  ];

  const currentPathRole = pathname.split('/')[1]?.toUpperCase() as UserRole;

  // 초대 링크 감지 및 자동 설정 (Invite Handler)
  useEffect(() => {
    const inviteId = searchParams.get('inviteId');
    if (inviteId && user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      
      updateDoc(userRef, {
        role: 'HOSPITAL',
        hospitalId: inviteId,
        updatedAt: serverTimestamp(),
      }).then(() => {
        toast({
          title: "초대 링크 확인됨",
          description: "해당 병원의 담당자로 설정되었습니다.",
        });
        router.replace('/hospital');
      });
    }
  }, [searchParams, user, firestore, router, toast]);

  // 자동 익명 로그인
  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  // 사용자가 로그인되었을 때 프로필 생성/업데이트 (초기 진입 시)
  useEffect(() => {
    if (user && firestore && currentPathRole) {
      const userRef = doc(firestore, 'users', user.uid);
      // 기존 hospitalId가 있다면 유지, 없다면 null로 설정 (하드코딩 제거)
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        username: user.email || `user_${user.uid.slice(0, 5)}`,
        name: user.displayName || '테스트 사용자',
        role: currentPathRole,
        isActive: true,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
  }, [user, firestore, currentPathRole]);

  const handleRoleSwitch = (roleId: UserRole) => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userRef, {
        role: roleId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    router.push(`/${roleId.toLowerCase()}`);
    setIsOpen(false);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = dragRef.current.startY - e.clientY;
      setPosition({
        x: Math.max(0, dragRef.current.startPosX + dx),
        y: Math.max(0, dragRef.current.startPosY + dy),
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="fixed z-50 transition-shadow duration-200"
      style={{ left: `${position.x}px`, bottom: `${position.y}px` }}
    >
      {!isOpen ? (
        <Button
          onMouseDown={onMouseDown}
          onClick={() => !isDragging && setIsOpen(true)}
          className={cn(
            "h-12 w-12 rounded-full shadow-2xl p-0 flex items-center justify-center bg-primary text-white border-2 border-white/20 hover:scale-105 active:scale-95 transition-transform cursor-grab active:cursor-grabbing",
            isDragging && "scale-110 shadow-primary/40"
          )}
        >
          <GripVertical className="h-5 w-5 opacity-50 absolute left-1" />
          <ShieldCheck className="h-6 w-6" />
        </Button>
      ) : (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 p-4 w-72 animate-in fade-in zoom-in-95 duration-200">
          <div 
            onMouseDown={onMouseDown}
            className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">역할 전환 엔진</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {roles.map((role) => (
              <Button
                key={role.id}
                variant={currentPathRole === role.id ? 'default' : 'outline'}
                className={cn(
                  "justify-start gap-3 rounded-2xl h-12 border-none transition-all",
                  currentPathRole === role.id ? "bg-primary shadow-lg shadow-primary/20" : "hover:bg-slate-50 text-slate-600"
                )}
                onClick={() => handleRoleSwitch(role.id)}
              >
                <div className={cn(
                  "p-1.5 rounded-lg",
                  currentPathRole === role.id ? "bg-white/20" : "bg-slate-100"
                )}>
                  <role.icon className={cn("h-4 w-4", currentPathRole === role.id ? "text-white" : role.color)} />
                </div>
                <span className="font-bold text-sm">{role.label}</span>
                {currentPathRole === role.id && <div className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />}
              </Button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400">UID: {user?.uid.slice(0, 8)}...</span>
              <span className={cn(
                "text-[9px] font-black",
                user ? "text-emerald-500" : "text-orange-500"
              )}>
                {user ? "AUTHENTICATED" : "NOT LOGGED IN"}
              </span>
            </div>
            {!user && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-xl h-8 text-[10px] font-bold bg-secondary/10 text-secondary hover:bg-secondary/20"
                onClick={() => auth && initiateAnonymousSignIn(auth)}
              >
                <LogIn className="h-3 w-3 mr-1" /> 재로그인
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
