"use client"

import { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/app/lib/types';
import { Hospital, Truck, Factory, ShieldCheck, GripVertical, X, Loader2 } from 'lucide-react';
import { useAuth, useFirestore, initiateAnonymousSignIn, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function RoleSelectorContent() {
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
  const [isSwitching, setIsSwitching] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const roles: { id: UserRole; label: string; icon: any; color: string }[] = [
    { id: 'HOSPITAL', label: '병원담당자', icon: Hospital, color: 'text-blue-600' },
    { id: 'DRIVER', label: '수거기사', icon: Truck, color: 'text-emerald-600' },
    { id: 'FACTORY', label: '공장관리', icon: Factory, color: 'text-purple-600' },
    { id: 'ADMIN', label: '총괄관리자', icon: ShieldCheck, color: 'text-slate-800' },
  ];

  const currentPathRole = pathname.split('/')[1]?.toUpperCase() as UserRole;

  // 자동 익명 로그인 (로그인 페이지가 아닌 경우에만 프로토타입 편의를 위해 유지)
  useEffect(() => {
    if (!isUserLoading && !user && auth && pathname !== '/login') {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth, pathname]);

  // 프로필 초기 생성 및 유지
  useEffect(() => {
    const syncUserProfile = async () => {
      if (user && firestore && !isSwitching) {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        // URL 쿼리 파라미터에서 초대 정보 확인
        const inviteId = searchParams.get('inviteId');
        const driverInvite = searchParams.get('driverInvite');
        const inviteName = searchParams.get('name');

        if (!userSnap.exists()) {
          // 신규 유저 생성
          const role = inviteId ? 'HOSPITAL' : (driverInvite ? 'DRIVER' : (currentPathRole || 'HOSPITAL'));
          setDocumentNonBlocking(userRef, {
            id: user.uid,
            username: user.email || `user_${user.uid.slice(0, 5)}`,
            name: inviteName || user.displayName || '사용자',
            role: role,
            hospitalId: inviteId || null,
            isActive: true,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          }, { merge: true });
          
          if (role && pathname === '/') router.push(`/${role.toLowerCase()}`);
        } else if (inviteId && userSnap.data()?.hospitalId !== inviteId) {
          // 이미 유저가 있지만 새로운 병원 초대 링크로 들어온 경우 업데이트
          updateDoc(userRef, {
            hospitalId: inviteId,
            role: 'HOSPITAL',
            updatedAt: serverTimestamp()
          });
          toast({ title: "소속 병원 변경", description: "초대받은 병원으로 소속이 변경되었습니다." });
          router.push('/hospital');
        }
      }
    };
    syncUserProfile();
  }, [user, firestore, currentPathRole, isSwitching, searchParams, router, toast, pathname]);

  const handleRoleSwitch = async (roleId: UserRole) => {
    if (!user || !firestore) return;
    
    setIsSwitching(true);
    const userRef = doc(firestore, 'users', user.uid);
    
    try {
      await updateDoc(userRef, {
        role: roleId,
        updatedAt: serverTimestamp(),
      });
      
      router.push(`/${roleId.toLowerCase()}`);
      setIsOpen(false);
      toast({
        title: "역할 전환",
        description: `사용자 권한이 [${roleId}]로 변경되었습니다.`,
      });
    } catch (e) {
      console.error(e);
      router.push(`/${roleId.toLowerCase()}`);
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

  // 로그인 페이지에서는 툴을 숨김 (깔끔한 UI를 위해)
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
                disabled={isSwitching}
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
                  {isSwitching && currentPathRole === role.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <role.icon className={cn("h-4 w-4", currentPathRole === role.id ? "text-white" : role.color)} />
                  )}
                </div>
                <span className="font-bold text-sm">{role.label}</span>
                {currentPathRole === role.id && <div className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />}
              </Button>
            ))}
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
