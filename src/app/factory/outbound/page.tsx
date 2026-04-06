
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackageCheck, ArrowRight, Loader2, ClipboardCheck, History } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';

export default function FactoryOutboundPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  // 포장이 완료되어 출고 대기 중인 항목 조회
  const outboundQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('currentStatus', '==', '포장완료')
    );
  }, [firestore, user]);

  const { data: requests, isLoading } = useCollection(outboundQuery);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">출고 준비 및 검수</h1>
          <p className="text-muted-foreground font-medium">세탁 및 포장이 완료된 세탁물을 기사님께 인계하기 전 최종 수량을 확인합니다.</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">진행 가능</p>
          <p className="text-lg font-black text-indigo-900">{requests?.length || 0}건 대기 중</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-400 font-bold">출고 데이터를 구성 중입니다...</p>
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req) => (
            <Card key={req.id} className="border-none shadow-sm rounded-[32px] overflow-hidden hover:shadow-xl transition-all bg-white group">
              <CardContent className="p-0">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-widest">
                          ID: {req.id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">{req.hospitalName}</h3>
                    </div>
                    <StatusBadge status={req.currentStatus as any} />
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <History className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">수거일</p>
                        <p className="text-sm font-bold text-slate-700">{req.requestDate}</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-100" />
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <PackageCheck className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">포장 완료일</p>
                        <p className="text-sm font-bold text-indigo-600">{new Date(req.updatedAt || req.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-100">
                  <Button className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg gap-2 shadow-lg shadow-indigo-200 transition-all group-hover:scale-[1.01]" asChild>
                    <Link href={`/factory/outbound/${req.id}`}>
                      최종 수량 검수 및 출고 <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center border-4 border-dashed border-slate-100 rounded-[48px] bg-white space-y-6">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
            <ClipboardCheck className="h-12 w-12 text-slate-200" />
          </div>
          <div className="space-y-2">
            <p className="text-slate-400 font-black text-2xl tracking-tight">출고 대기 중인 항목이 없습니다.</p>
            <p className="text-sm text-slate-300 font-medium">모든 포장 완료 건이 출고 처리되었습니다.</p>
          </div>
          <Button variant="outline" className="rounded-xl font-bold" asChild>
            <Link href="/factory">공정 보드 확인하기</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
