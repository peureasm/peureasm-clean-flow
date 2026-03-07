
"use client"

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Phone, CheckCircle2, ChevronRight, AlertTriangle, ClipboardCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

export default function DriverDashboard() {
  const firestore = useFirestore();

  // 수거 대기 중인 요청들만 조회
  const collectionQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('currentStatus', 'in', ['제출', '출고']),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(collectionQuery);

  const collectionList = requests?.filter(r => r.currentStatus === '제출') || [];
  const deliveryList = requests?.filter(r => r.currentStatus === '출고') || [];

  return (
    <div className="p-4 space-y-6">
      <section className="space-y-2 py-4">
        <h1 className="text-2xl font-black text-white">수거 및 납품 경로</h1>
        <p className="text-slate-300 text-sm font-medium">오늘 예정된 일정 <span className="text-secondary font-bold">{requests?.length || 0}건</span></p>
      </section>

      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest">
          <div className="h-2 w-2 rounded-full bg-secondary animate-pulse"></div>
          다음 수거 장소
        </h2>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-3xl border border-white/5">로딩 중...</div>
        ) : collectionList.length > 0 ? (
          <Card className="bg-slate-800 border-none shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/10">
            <CardContent className="p-0">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white">{collectionList[0].hospitalName}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-slate-300 font-medium">
                      <MapPin className="h-4 w-4 text-secondary" />
                      <span>서울시 강남구 테헤란로 123</span>
                    </div>
                  </div>
                  <Badge className="bg-secondary text-secondary-foreground font-black px-3 py-1 rounded-full">수거대기</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="border-white/10 bg-slate-700/50 text-white rounded-2xl gap-2 h-14 font-bold hover:bg-slate-700 transition-all">
                    <Phone className="h-5 w-5" /> 전화하기
                  </Button>
                  <Button className="bg-secondary text-secondary-foreground rounded-2xl gap-2 h-14 font-black shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    <Navigation className="h-5 w-5" /> 길안내
                  </Button>
                </div>
              </div>
              <Link href={`/driver/collection/${collectionList[0].id}`}>
                <div className="bg-white/5 p-6 border-t border-white/5 flex items-center justify-between hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 group-hover:border-secondary/50 transition-all">
                      <ClipboardCheck className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">수거 확인 진행</p>
                      <p className="text-xs text-slate-400 font-medium">{collectionList[0].desiredPickupTime} 예정</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-slate-500 group-hover:text-white transition-all" />
                </div>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-3xl border border-dashed border-white/10 font-bold">대기 중인 수거 일정이 없습니다.</div>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">남은 일정 목록</h2>
        
        <div className="space-y-3">
          {deliveryList.map((req) => (
            <Card key={req.id} className="bg-slate-800 border-none rounded-2xl ring-1 ring-white/5 hover:ring-white/20 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/5">
                    <Truck className="h-7 w-7 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-black text-white text-lg">{req.hospitalName}</p>
                    <p className="text-xs text-slate-300 font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full inline-block mt-1">납품 대기 중</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-slate-600" />
              </CardContent>
            </Card>
          ))}

          {requests?.filter(r => r.currentStatus === '수거완료').map((req) => (
            <Card key={req.id} className="bg-slate-800/40 border-none rounded-2xl opacity-70 grayscale">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">{req.hospitalName}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">수거 완료</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/5 font-black">DONE</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="bg-amber-500/10 border border-amber-500/20 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <AlertTriangle className="h-16 w-16 text-amber-500" />
        </div>
        <CardContent className="p-6 flex gap-4 relative z-10">
          <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
          <div className="space-y-1">
            <p className="text-base font-black text-amber-400">시스템 공지</p>
            <p className="text-sm text-slate-200 leading-relaxed">공장 설비 점검으로 인해 오늘 오후 납품 일정이 <span className="text-amber-400 font-bold">약 30분 정도 지연</span>될 수 있습니다. 배차 일정에 참고해 주세요.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
