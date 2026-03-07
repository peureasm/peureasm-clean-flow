
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Plus, Package, Clock } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

export default function HospitalDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  // 사용자의 병원 ID를 기반으로 요청 쿼리 생성
  // 실제 운영 환경에서는 유저 문서에서 hospitalId를 가져와야 합니다.
  // 여기서는 데모를 위해 'h1' 병원 데이터를 기본으로 조회합니다.
  const hospitalId = 'h1'; 

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', '==', hospitalId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore]);

  const { data: myRequests, isLoading } = useCollection(requestsQuery);

  const stats = {
    totalThisMonth: myRequests?.length || 0,
    pending: myRequests?.filter(r => r.currentStatus === '제출').length || 0
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto sm:max-w-7xl">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">반갑습니다, {user?.displayName || '담당자'}님</h1>
        <p className="text-muted-foreground">오늘의 세탁물 수거 현황입니다.</p>
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

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">로딩 중...</div>
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
                    <StatusBadge status={req.currentStatus} />
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
            <h3 className="font-bold text-lg">알림</h3>
          </div>
          <p className="text-sm text-slate-300">Firestore와 실시간으로 연동되어 상태가 즉시 반영됩니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
