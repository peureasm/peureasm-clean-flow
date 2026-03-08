
"use client"

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronLeft, Search, Filter, Package, Clock, Calendar, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';

export default function HospitalRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const firestore = useFirestore();
  const { user } = useUser();

  // 사용자 프로필에서 병원 ID 가져오기
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  // 실시간 요청 데이터 구독 (병원 ID로 강력 필터링)
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !userData?.hospitalId) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', '==', userData.hospitalId),
    );
  }, [firestore, userData?.hospitalId]);

  const { data: requests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

  const filteredRequests = requests?.filter(req => 
    req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestDate.includes(searchTerm)
  ) || [];

  const getStatusCategory = (status: string) => {
    if (['제출', '수거완료', '공장입고', '세탁중', '건조중', '포장완료', '출고'].includes(status)) return 'ongoing';
    if (['납품완료', '병원확인완료', '종결'].includes(status)) return 'completed';
    return 'pending';
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userData?.hospitalId) {
    return (
      <div className="p-12 text-center max-w-sm mx-auto mt-20 space-y-4">
        <AlertCircle className="h-12 w-12 text-orange-400 mx-auto" />
        <h2 className="text-xl font-bold">권한이 없습니다</h2>
        <p className="text-sm text-muted-foreground">병원 배정 링크를 통해 접속해 주세요.</p>
        <Button asChild className="rounded-xl"><Link href="/hospital">대시보드로</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-[#F8FAFC] min-h-screen">
      <div className="sticky top-0 z-20 bg-white border-b p-4 flex items-center justify-between shadow-sm">
        <Link href="/hospital" className="p-2 hover:bg-slate-50 rounded-full">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-slate-900">전체 요청 내역</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Filter className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="요청 ID 또는 날짜로 검색" 
            className="pl-10 rounded-2xl border-none shadow-sm h-12 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-2xl bg-slate-100 p-1 h-12">
            <TabsTrigger value="all" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">전체</TabsTrigger>
            <TabsTrigger value="ongoing" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">진행 중</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">완료</TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
            {isRequestsLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-bold text-slate-400">데이터 동기화 중...</p>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="m-0 space-y-4">
                  {filteredRequests.map((req) => (
                    <RequestCard key={req.id} req={req} />
                  ))}
                </TabsContent>
                <TabsContent value="ongoing" className="m-0 space-y-4">
                  {filteredRequests.filter(r => getStatusCategory(r.currentStatus) === 'ongoing').map((req) => (
                    <RequestCard key={req.id} req={req} />
                  ))}
                </TabsContent>
                <TabsContent value="completed" className="m-0 space-y-4">
                  {filteredRequests.filter(r => getStatusCategory(r.currentStatus) === 'completed').map((req) => (
                    <RequestCard key={req.id} req={req} />
                  ))}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>

        {!isRequestsLoading && filteredRequests.length === 0 && (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <Package className="h-12 w-12 text-slate-200 mx-auto" />
            <p className="text-slate-400 font-bold">검색된 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ req }: { req: any }) {
  return (
    <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
      <CardContent className="p-0">
        <Link href={`/hospital/requests/${req.id}`} className="block p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 uppercase tracking-widest">
                  ID: {req.id.slice(-8)}
                </span>
              </div>
              <h3 className="font-black text-slate-900 text-lg">{req.requestDate} 수거 요청</h3>
            </div>
            <StatusBadge status={req.currentStatus} />
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-bold border-t border-slate-50 pt-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-300" />
              <span>{req.requestDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4 text-slate-300" />
              <span>{req.isContaminated ? '오염물 주의' : '일반 세탁'}</span>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
