
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Plus, Package, Clock, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';

export default function HospitalDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // 1. 사용자 프로필 조회
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  // 2. 사용자의 소속 병원 정보 조회
  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !userData?.hospitalId) return null;
    return doc(firestore, 'hospitals', userData.hospitalId);
  }, [firestore, userData?.hospitalId]);

  const { data: hospital, isLoading: isHospLoading } = useDoc(hospitalRef);

  // 3. 해당 병원의 최근 요청 내역 조회
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !userData?.hospitalId) return null;
    
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', '==', userData.hospitalId),
      limit(10)
    );
  }, [firestore, userData?.hospitalId]);

  const { data: myRequests, isLoading: isRequestsLoading, error: requestsError } = useCollection(requestsQuery);

  const stats = {
    totalThisMonth: myRequests?.length || 0,
    pending: myRequests?.filter(r => ['제출', '수거완료', '공장입고', '세탁중', '건조중', '포장완료', '출고'].includes(r.currentStatus)).length || 0
  };

  if (isUserLoading || isUserDocLoading || isHospLoading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold">병원 정보를 불러오고 있습니다...</p>
      </div>
    );
  }

  if (requestsError) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4 text-destructive bg-destructive/5 rounded-3xl m-4">
        <AlertCircle className="h-12 w-12" />
        <p className="font-bold">데이터를 불러오는 중 문제가 발생했습니다.</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">새로고침</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-lg mx-auto sm:max-w-7xl animate-in fade-in duration-500">
      <section className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-primary/20">
            {userData?.name?.[0] || '김'}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">반갑습니다, {userData?.name || '담당자'}님</h1>
            <p className="text-sm text-muted-foreground font-medium">소속: <span className="text-primary font-bold">{hospital?.name || '지정 병원'}</span></p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.totalThisMonth}건</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">전체 요청</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.pending}건</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">처리 중</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Link href="/hospital/new">
        <Button className="w-full h-16 rounded-2xl text-lg font-bold flex gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
          <Plus className="h-6 w-6" />
          신규 수거 요청 등록
        </Button>
      </Link>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-slate-800">최근 진행 내역</h2>
          <Link href="/hospital/requests" className="text-xs text-primary font-bold flex items-center bg-primary/5 px-3 py-1.5 rounded-full">
            더보기 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isRequestsLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-300"></div>
            <p className="text-xs text-muted-foreground">내역 로딩 중...</p>
          </div>
        ) : myRequests && myRequests.length > 0 ? (
          <div className="space-y-3">
            {myRequests.map((req) => (
              <Card key={req.id} className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
                <CardContent className="p-0">
                  <Link href={`/hospital/requests/${req.id}`} className="block p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
                            ID: {req.id.slice(-6)}
                          </span>
                        </div>
                        <p className="font-black text-slate-800">{req.requestDate} 수거 건</p>
                      </div>
                      <StatusBadge status={req.currentStatus as any} />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Package className="h-3.5 w-3.5" />
                        <span>{req.specialNotes ? '특이사항 포함' : '일반 세탁물'}</span>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Package className="h-8 w-8 text-slate-200" />
            </div>
            <div>
              <p className="text-slate-400 font-bold">진행 중인 수거 내역이 없습니다.</p>
              <p className="text-[11px] text-slate-300">첫 번째 수거 요청을 등록해 보세요!</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
