'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFirestore, useUser, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/app/lib/types';
import { isAdminEmail } from '@/lib/admin-emails';

/**
 * 신규 사용자 문서 생성·초대 링크 동기화·허용 목록 관리자 이메일의 role 보정.
 * (역할 전환 UI는 사용하지 않음 — 권한은 Firestore 단일 소스)
 */
function UserProfileSyncInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user, userData, isUserLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !firestore || isUserLoading) return;

    const userRef = doc(firestore, 'users', user.uid);
    const inviteId = searchParams.get('inviteId');
    const driverInvite = searchParams.get('driverInvite');
    const inviteName = searchParams.get('name');

    if (!userData) {
      let defaultRole: UserRole = inviteId
        ? 'HOSPITAL'
        : driverInvite
          ? 'DRIVER'
          : isAdminEmail(user.email)
            ? 'ADMIN'
            : 'HOSPITAL';

      setDocumentNonBlocking(
        userRef,
        {
          id: user.uid,
          username: user.email || `user_${user.uid.slice(0, 8)}`,
          name: inviteName || user.displayName || '신규 사용자',
          role: defaultRole,
          hospitalId: inviteId || null,
          isActive: true,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    if (inviteId && userData.hospitalId !== inviteId) {
      updateDocumentNonBlocking(userRef, {
        hospitalId: inviteId,
        role: 'HOSPITAL',
        updatedAt: serverTimestamp(),
      });
      toast({
        title: '소속 정보 업데이트',
        description: `${inviteName || '병원'}의 담당자로 소속이 변경되었습니다.`,
      });
      if (pathname !== '/hospital') router.push('/hospital');
    }
  }, [user, userData, isUserLoading, firestore, searchParams, toast, pathname, router]);

  /** 허용 목록 이메일인데 Firestore role이 ADMIN이 아닌 경우(예: 예전 역할 전환 잔여) 보정 */
  useEffect(() => {
    if (!user?.email || !firestore || !userData || isUserLoading) return;
    if (!isAdminEmail(user.email)) return;
    if (userData.role === 'ADMIN') return;

    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      role: 'ADMIN',
      updatedAt: serverTimestamp(),
    });
  }, [user, userData, firestore, isUserLoading]);

  return null;
}

export default function UserProfileSync() {
  return (
    <Suspense fallback={null}>
      <UserProfileSyncInner />
    </Suspense>
  );
}
