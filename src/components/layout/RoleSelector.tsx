
"use client"

import { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/app/lib/types';
import { Hospital, Truck, Factory, ShieldCheck, GripVertical, X, Loader2, Sparkles } from 'lucide-react';
import { useAuth, useFirestore, useUser, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function RoleSelectorContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user, userData, isUserLoading } = useUser();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const roles: { id: UserRole; label: string; icon: any; color: string }[] = [
    { id: 'HOSPITAL', label: '병원담당자', icon: Hospital, color: 'text-blue-600' },
    { id: 'DRIVER', label: '수거기사', icon: Truck, color: 'text-emerald-600' },
    { id: 'FACTORY', label: '공장관리', icon: Factory, color: 'text-purple-600' },
    { id: 'ADMIN', label: '총괄관리자', icon: ShieldCheck, color: 'text-slate-800' },
  ];

  // 프로필 초기 생성 및 초대 정보 동기화 로직 전용 Effect
  useEffect(() => {
    const syncUserProfile = async () => {
      // 1. 로그인 상태 확인 (로그아웃 루프 방지)
      if (!user || !firestore || isUserLoading || isSwitching) return;

      const userRef = doc(firestore, 'users', user.uid);
      const inviteId = searchParams.get('inviteId');
      const driverInvite = searchParams.get('driverInvite');
      const inviteName = searchParams.get('name');

      // 2. 신규 사용자 프로필 생성
      if (!userData) {
        const defaultRole = inviteId ? 'HOSPITAL' : (driverInvite ? 'DRIVER' : 'HOSPITAL');
        
        setDocumentNonBlocking(userRef, {
          id: user.uid,
          username: user.email || `anon_${user.uid.slice(0, 5)}`,
          name: inviteName || user.displayName || '신규 사용자',
          role: defaultRole,
          hospitalId: inviteId || null,
          isActive: true,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        }, { merge: true });
        
        console.log(`[RoleSelector] New profile created for ${user.uid} with role ${defaultRole}`);
      } 
      // 3. 초대 링크를 통한 소속 업데이트 (HOSPITAL 한정)
      else if (inviteId && userData.hospitalId !== inviteId) {
        updateDocumentNonBlocking(userRef, {
          hospitalId: inviteId,
          role: 'HOSPITAL',
          updatedAt: serverTimestamp()
        });
        
        toast({ 
          title: "소속 정보 업데이트", 
          description: `${inviteName || '병원'}의 담당자로 소속이 변경되었습니다.`,
        });
        
        if (pathname !== '/hospital') router.push('/hospital');
      }
    };

    syncUserProfile();
  }, [user, userData, isUserLoading, firestore, searchParams, toast]);

  const handleRoleSwitch = async (roleId: UserRole) => {
    if (!user || !firestore || isSwitching) return;
    
    setIsSwitching(true);
    const userRef = doc(firestore, 'users', user.uid);
    
    try {
      updateDocumentNonBlocking(userRef, {
        role: roleId,
        updatedAt: serverTimestamp(),
      });
      
      // 전환 알림 및 이동
      toast({
        title: "권한 전환 완료",
        description: `사용자 권한이 [${roleId}] 모드로 변경되었습니다.`,
      });
      
      router.push(`/${roleId.toLowerCase()}`);
      setIsOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSwitching(false);
    }
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
    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  // 로그인 페이지나 유저가 없을 때는 렌더링하지 않음
  if (pathname === '/login' || !user) return null;

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
            "h-14 w-14 rounded-full shadow-2xl p-0 flex items-center justify-center bg-slate-900 text-white border-2 border-white/20 hover:scale-105 active:scale-95 transition-all cursor-grab active:cursor-grabbing group",
            isDragging && "scale-110 shadow-primary/40 ring-4 ring-primary/20"
          )}
        >
          <GripVertical className="h-5 w-5 opacity-30 absolute left-1 group-hover:opacity-60 transition-opacity" />
          <ShieldCheck className="h-7 w-7" />
        </Button>
      ) : (
        <div className="bg-white/95 backdrop-blur-md rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-slate-200 p-5 w-80 animate-in fade-in zoom-in-95 duration-200">
          <div 
            onMouseDown={onMouseDown}
            className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">권한 시뮬레이터</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 text-slate-400" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {roles.map((role) => (
              <Button
                key={role.id}
                variant={userData?.role === role.id ? 'default' : 'outline'}
                disabled={isSwitching}
                className={cn(
                  "justify-start gap-4 rounded-2xl h-14 border-none transition-all group",
                  userData?.role === role.id 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                    : "hover:bg-slate-50 text-slate-600 bg-slate-50/50"
                )}
                onClick={() => handleRoleSwitch(role.id)}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  userData?.role === role.id ? "bg-white/15" : "bg-white shadow-sm"
                )}>
                  {isSwitching && userData?.role === role.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <role.icon className={cn("h-5 w-5", userData?.role === role.id ? "text-white" : role.color)} />
                  )}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-black text-sm">{role.label}</span>
                  <span className={cn("text-[9px] font-bold uppercase tracking-tight", userData?.role === role.id ? "text-white/50" : "text-slate-400")}>
                    {role.id} Access
                  </span>
                </div>
                {userData?.role === role.id && (
                  <div className="ml-auto flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                  </div>
                )}
              </Button>
            ))}
          </div>
          
          <div className="mt-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-3 items-start">
            <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700/80 font-medium leading-relaxed">
              프로토타입 테스트를 위해 역할을 자유롭게 전환할 수 있습니다. 전환 시 대시보드가 자동으로 이동합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoleSelector() {
  return (
    <Suspense fallback={null}>
      <RoleSelectorContent />
    </Suspense>
  );
}
