
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Plus, Package, Clock } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';

export default function HospitalDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // 사용자의 실시간 프로필 정보를 가져옵니다.
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  // 쿼리는 사용자 프로필이 로드되고 hospitalId가 확실히 있을 때만 실행합니다.
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user || isUserDocLoading || !userData?.hospitalId) return null;
    
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', '==', userData.hospitalId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore, user, userData?.hospitalId, isUserDocLoading]);

  const { data: myRequests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

  const stats = {
    totalThisMonth: myRequests?.length || 0,
    pending: myRequests?.filter(r => r.currentStatus === '제출').length || 0
  };

  if (isUserLoading || isUserDocLoading) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">인증 및 프로필 확인 중...</p>
      </div>
    );
  }

  // 프로필이 없는 경우 (최초 접속 시 RoleSelector가 생성 중일 수 있음)
  if (!userData?.hospitalId) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4">
        <Package className="h-12 w-12 text-slate-200 animate-pulse" />
        <p className="text-muted-foreground">병원 정보를 설정하고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto sm:max-w-7xl">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">반갑습니다, {userData?.name || '담당자'}님</h1>
        <p className="text-muted-foreground">{userData?.hospitalId === 'h1' ? '서울메디컬병원' : '등록된 병원'}의 수거 현황입니다.</p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
            <Package className="h-8 w-8 text-primary" />
            <p className="text-2xl font-bold">{stats.totalThisMonth}건</p>
            <p className="text-xs text-muted-foreground">최근 요청 수</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-secondary/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
            <Clock className="h-8 w-8 text-secondary" />
            <p className="text-2xl font-bold">{stats.pending}건</p>
            <p className="text-xs text-muted-foreground">수거 대기</p>
          </CardContent>
        </Card>
      </div>

      <Link href="/hospital/new">
        <Button className="w-full h-14 rounded-2xl text-lg font-bold flex gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-6 w-6" />
          신규 수거 요청 등록
        </Button>
      </Link>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">최근 요청 내역</h2>
          <Link href="/hospital/requests" className="text-sm text-primary font-medium flex items-center">
            전체보기 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isRequestsLoading ? (
          <div className="py-10 text-center text-muted-foreground">데이터 로딩 중...</div>
        ) : myRequests && myRequests.length > 0 ? (
          myRequests.map((req) => (
            <Card key={req.id} className="rounded-2xl overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <Link href={`/hospital/requests/${req.id}`} className="block p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">{req.id}</p>
                      <p className="font-bold">{req.requestDate} 수거 건</p>
                    </div>
                    <StatusBadge status={req.currentStatus as any} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{req.specialNotes ? '특이사항 있음' : '일반 수거'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{req.desiredPickupTime}</span>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-10 text-center text-muted-foreground">등록된 요청이 없습니다.</div>
        )}
      </section>

      <Card className="bg-slate-900 text-white rounded-2xl border-none">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">실시간 보안 연동</h3>
          </div>
          <p className="text-sm text-slate-300">
            사용자 역할: <strong>{userData?.role}</strong><br />
            병원 ID: <strong>{userData?.hospitalId}</strong>
          </p>
          <p className="text-[11px] text-slate-400">
            Firestore Security Rules가 귀하의 병원 데이터만 안전하게 필터링하여 보여줍니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
