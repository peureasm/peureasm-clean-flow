
"use client"

import { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/app/lib/types';
import { Hospital, Truck, Factory, ShieldCheck, GripVertical, X, Loader2 } from 'lucide-react';
import { useAuth, useFirestore, initiateAnonymousSignIn, useUser, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function RoleSelectorContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const auth = useAuth();
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

  const currentPathRole = pathname.split('/')[1]?.toUpperCase() as UserRole;

  // 자동 익명 로그인 (프로토타입 편의를 위해 유지하되 에러 처리 강화)
  useEffect(() => {
    if (!isUserLoading && !user && auth && pathname !== '/login') {
      initiateAnonymousSignIn(auth).catch((err) => console.log("Anonymous sign-in skipped:", err.message));
    }
  }, [user, isUserLoading, auth, pathname]);

  // 프로필 초기 생성 및 초대 정보 동기화
  useEffect(() => {
    const syncUserProfile = async () => {
      if (user && firestore && !isSwitching) {
        const userRef = doc(firestore, 'users', user.uid);
        
        // URL 쿼리 파라미터에서 초대 정보 확인
        const inviteId = searchParams.get('inviteId');
        const driverInvite = searchParams.get('driverInvite');
        const inviteName = searchParams.get('name');

        if (!userData) {
          // 신규 유저 데이터가 전역 상태에 없는 경우(또는 아직 생성 전) 생성 로직
          const role = inviteId ? 'HOSPITAL' : (driverInvite ? 'DRIVER' : (currentPathRole || 'HOSPITAL'));
          setDocumentNonBlocking(userRef, {
            id: user.uid,
            username: user.email || `user_${user.uid.slice(0, 5)}`,
            name: inviteName || user.displayName || '신규 사용자',
            role: role,
            hospitalId: inviteId || null,
            isActive: true,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          }, { merge: true });
          
          if (role && pathname === '/') router.push(`/${role.toLowerCase()}`);
        } else if (inviteId && userData.hospitalId !== inviteId) {
          // 이미 유저가 있지만 새로운 병원 초대 링크로 들어온 경우 업데이트
          updateDocumentNonBlocking(userRef, {
            hospitalId: inviteId,
            role: 'HOSPITAL',
            updatedAt: serverTimestamp()
          });
          toast({ title: "소속 병원 변경", description: "초대받은 병원으로 소속 정보가 업데이트되었습니다." });
          router.push('/hospital');
        }
      }
    };
    syncUserProfile();
  }, [user, userData, firestore, isSwitching, searchParams, router, toast, pathname, currentPathRole]);

  const handleRoleSwitch = async (roleId: UserRole) => {
    if (!user || !firestore) return;
    
    setIsSwitching(true);
    const userRef = doc(firestore, 'users', user.uid);
    
    try {
      updateDocumentNonBlocking(userRef, {
        role: roleId,
        updatedAt: serverTimestamp(),
      });
      
      router.push(`/${roleId.toLowerCase()}`);
      setIsOpen(false);
      toast({
        title: "권한 전환 완료",
        description: `사용자 권한이 [${roleId}] 데이터로 변경되었습니다.`,
      });
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

  if (pathname === '/login') return null;

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
            "h-12 w-12 rounded-full shadow-2xl p-0 flex items-center justify-center bg-slate-900 text-white border-2 border-white/20 hover:scale-105 active:scale-95 transition-transform cursor-grab active:cursor-grabbing",
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">실시간 권한 데이타 전환</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {roles.map((role) => (
              <Button
                key={role.id}
                variant={userData?.role === role.id ? 'default' : 'outline'}
                disabled={isSwitching}
                className={cn(
                  "justify-start gap-3 rounded-2xl h-12 border-none transition-all",
                  userData?.role === role.id ? "bg-slate-900 shadow-lg shadow-slate-200" : "hover:bg-slate-50 text-slate-600"
                )}
                onClick={() => handleRoleSwitch(role.id)}
              >
                <div className={cn(
                  "p-1.5 rounded-lg",
                  userData?.role === role.id ? "bg-white/20" : "bg-slate-100"
                )}>
                  {isSwitching && userData?.role === role.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <role.icon className={cn("h-4 w-4", userData?.role === role.id ? "text-white" : role.color)} />
                  )}
                </div>
                <span className="font-bold text-sm">{role.label}</span>
                {userData?.role === role.id && <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-[9px] text-slate-400 font-medium px-2 leading-relaxed text-center">
            전환 시 Firestore의 사용자 프로필 데이터가 실시간으로 변경되며 해당 서비스 대시보드로 자동 이동합니다.
          </p>
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
