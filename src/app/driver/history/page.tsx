
"use client"

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, History, ChevronRight, Loader2, Calendar, Package, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import StatusBadge from '@/components/shared/StatusBadge';

export default function DriverHistoryPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

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

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user || assignedHospitalIds.length === 0) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', 'in', assignedHospitalIds.slice(0, 30)),
      limit(200)
    );
  }, [firestore, user, assignedHospitalIds]);

  const { data: allRequests, isLoading: isReqLoading } = useCollection(requestsQuery);

  const myHistory = allRequests?.filter(r => 
    r.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.requestDate.includes(searchTerm)
  ).sort((a, b) => b.requestDate.localeCompare(a.requestDate)) || [];

  const ongoingStatuses = ['수거완료', '공장입고', '세탁중', '건조중', '포장완료', '출고'];
  const completedStatuses = ['납품완료', '병원확인완료', '종결'];

  const ongoingList = myHistory.filter(r => ongoingStatuses.includes(r.currentStatus));
  const completedList = myHistory.filter(r => completedStatuses.includes(r.currentStatus));

  if (isUserLoading || isHospLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      <p className="text-muted-foreground font-bold text-sm">운송 이력을 불러오는 중...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <section className="space-y-1">
        <h1 className="text-24px font-black text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-secondary" /> 운송 이력 조회
        </h1>
        <p className="text-muted-foreground text-sm font-medium">나의 모든 수거 및 납품 히스토리입니다.</p>
      </section>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          className="pl-11 rounded-2xl bg-white border-border shadow-sm h-14 font-medium focus:ring-secondary" 
          placeholder="병원명 또는 날짜 검색..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="ongoing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/50 p-1.5 h-14">
          <TabsTrigger value="ongoing" className="rounded-xl font-black text-sm data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-sm">
            진행 공정 ({ongoingList.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl font-black text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            완료 이력 ({completedList.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-8 space-y-4">
          <TabsContent value="ongoing" className="m-0 space-y-4">
            {isReqLoading ? (
              <div className="text-center py-10 text-slate-300 italic">데이터 동기화 중...</div>
            ) : ongoingList.length > 0 ? (
              ongoingList.map((req) => <HistoryCard key={req.id} req={req} />)
            ) : (
              <EmptyPlaceholder message="현재 진행 중인 운송 건이 없습니다." />
            )}
          </TabsContent>

          <TabsContent value="completed" className="m-0 space-y-4">
            {isReqLoading ? (
              <div className="text-center py-10 text-slate-300 italic">데이터 동기화 중...</div>
            ) : completedList.length > 0 ? (
              completedList.map((req) => <HistoryCard key={req.id} req={req} />)
            ) : (
              <EmptyPlaceholder message="완료된 운송 이력이 없습니다." />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function HistoryCard({ req }: { req: any }) {
  const isOutbound = ['출고', '납품완료', '병원확인완료', '종결'].includes(req.currentStatus);
  const detailPath = isOutbound ? `/driver/delivery/${req.id}` : `/driver/collection/${req.id}`;

  return (
    <Link href={detailPath}>
      <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-border hover:ring-secondary/30 hover:shadow-md transition-all group mb-4">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground line-clamp-1">{req.hospitalName}</h3>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                <Calendar className="h-3 w-3 text-secondary" /> {req.requestDate}
              </div>
            </div>
            <StatusBadge status={req.currentStatus} />
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-muted">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center border border-border group-hover:bg-accent group-hover:border-secondary/20 transition-all">
                 <Package className="h-5 w-5 text-slate-400 group-hover:text-secondary" />
               </div>
               <span className="text-xs text-muted-foreground font-bold group-hover:text-foreground transition-colors">상세 검수 데이터 확인</span>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyPlaceholder({ message }: { message: string }) {
  return (
    <div className="py-24 text-center border-2 border-dashed border-border rounded-[40px] bg-white space-y-4">
      <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
        <Package className="h-8 w-8 text-slate-300" />
      </div>
      <p className="text-slate-400 text-sm font-bold">{message}</p>
    </div>
  );
}
