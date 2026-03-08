
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, ArrowRight, Loader2, PackageSearch } from 'lucide-react';
import Link from 'next/link';

export default function FactoryInboundPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  // 기사가 수거 완료하여 공장에 도착 대기 중인 항목 조회
  const inboundQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('currentStatus', '==', '수거완료')
    );
  }, [firestore, user]);

  const { data: requests, isLoading } = useCollection(inboundQuery);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900">입고 대기 내역</h1>
        <p className="text-muted-foreground">기사가 수거 완료하여 공장 입고 검수가 필요한 항목들입니다.</p>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          <p className="text-slate-400 font-bold">입고 대기 데이터를 불러오는 중...</p>
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all bg-white border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">{req.hospitalName}</h3>
                    <p className="text-xs text-slate-400 font-mono">Request ID: {req.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-none font-black px-3 py-1">수거완료</Badge>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Truck className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">수거 정보</p>
                    <p className="text-sm font-bold text-slate-700">{req.requestDate} 수거건</p>
                  </div>
                </div>

                <Button className="w-full h-12 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black gap-2 shadow-lg shadow-purple-200" asChild>
                  <Link href={`/factory/inbound/${req.id}`}>
                    입고 수량 검수 시작 <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-white space-y-4">
          <PackageSearch className="h-16 w-16 mx-auto text-slate-200" />
          <div className="space-y-1">
            <p className="text-slate-400 font-black text-xl">입고 대기 중인 항목이 없습니다.</p>
            <p className="text-sm text-slate-300">기사가 수거를 완료하면 이곳에 나타납니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
