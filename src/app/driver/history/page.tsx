
"use client"

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, History, ChevronRight, Loader2, Calendar, Package } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import StatusBadge from '@/components/shared/StatusBadge';

export default function DriverHistoryPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  // 1. 현재 기사에게 배정된 병원 목록 조회 (ID 필터링용)
  const assignedHospitalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'hospitals'),
      where('assignedDriverId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: hospitals, isLoading: isHospLoading } = useCollection(assignedHospitalsQuery);
  
  const assignedHospitalIds = useMemoFirebase(() => {
    return hospitals?.map(h => h.id) || [];
  }, [hospitals]);

  // 2. 배정된 병원들의 요청 내역 조회
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user || assignedHospitalIds.length === 0) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', 'in', assignedHospitalIds.slice(0, 30)),
      limit(200)
    );
  }, [firestore, user, assignedHospitalIds]);

  const { data: allRequests, isLoading: isReqLoading } = useCollection(requestsQuery);

  // 검색어 적용 및 정렬
  const myHistory = allRequests?.filter(r => 
    r.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.requestDate.includes(searchTerm)
  ).sort((a, b) => b.requestDate.localeCompare(a.requestDate)) || [];

  // 상태에 따른 분류
  const ongoingStatuses = ['수거완료', '공장입고', '세탁중', '건조중', '포장완료', '출고'];
  const completedStatuses = ['납품완료', '병원확인완료', '종결'];

  const ongoingList = myHistory.filter(r => ongoingStatuses.includes(r.currentStatus));
  const completedList = myHistory.filter(r => completedStatuses.includes(r.currentStatus));

  if (isUserLoading || isHospLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-secondary" />
      <p className="text-slate-400 font-bold">수거 이력을 불러오는 중...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <section className="space-y-2 py-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <History className="h-6 w-6 text-secondary" /> 수거 및 운송 이력
        </h1>
        <p className="text-slate-300 text-sm font-medium">과거 진행했던 모든 세탁 공정 내역입니다.</p>
      </section>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          className="pl-10 rounded-2xl bg-slate-800 border-none text-white h-12 focus:ring-secondary" 
          placeholder="병원명 또는 날짜로 검색..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="ongoing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-800 p-1 h-12">
          <TabsTrigger value="ongoing" className="rounded-xl font-bold data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            진행 중 ({ongoingList.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl font-bold data-[state=active]:bg-slate-700 data-[state=active]:text-white">
            완료 ({completedList.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          <TabsContent value="ongoing" className="m-0 space-y-4">
            {isReqLoading ? (
              <div className="text-center py-10 text-slate-500 italic">데이터 로드 중...</div>
            ) : ongoingList.length > 0 ? (
              ongoingList.map((req) => <HistoryItem key={req.id} req={req} />)
            ) : (
              <EmptyState message="현재 진행 중인 공정이 없습니다." />
            )}
          </TabsContent>

          <TabsContent value="completed" className="m-0 space-y-4">
            {isReqLoading ? (
              <div className="text-center py-10 text-slate-500 italic">데이터 로드 중...</div>
            ) : completedList.length > 0 ? (
              completedList.map((req) => <HistoryItem key={req.id} req={req} />)
            ) : (
              <EmptyState message="완료된 이력이 없습니다." />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function HistoryItem({ req }: { req: any }) {
  const detailPath = (req.currentStatus === '출고' || req.currentStatus === '납품완료' || req.currentStatus === '병원확인완료' || req.currentStatus === '종결') 
    ? `/driver/delivery/${req.id}` 
    : `/driver/collection/${req.id}`;

  return (
    <Link href={detailPath}>
      <Card className="bg-slate-800 border-none shadow-xl rounded-3xl overflow-hidden ring-1 ring-white/10 hover:ring-secondary/50 transition-all group mb-4">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white line-clamp-1">{req.hospitalName}</h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <Calendar className="h-3 w-3" /> {req.requestDate} 수거건
              </div>
            </div>
            <StatusBadge status={req.currentStatus} />
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center border border-white/5">
                 <Package className="h-4 w-4 text-slate-400" />
               </div>
               <span className="text-xs text-slate-300 font-medium">상세 대조 데이터 확인</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-white transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-slate-800/30">
      <Package className="h-10 w-10 mx-auto mb-3 text-slate-600 opacity-20" />
      <p className="text-slate-500 text-sm font-bold">{message}</p>
    </div>
  );
}
