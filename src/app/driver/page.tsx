
"use client"

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Phone, ChevronRight, ClipboardCheck, Truck, PackageCheck, Loader2, Hospital } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export default function DriverDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // 1. 현재 기사에게 배정된 병원 목록 조회
  const assignedHospitalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'hospitals'),
      where('assignedDriverId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: assignedHospitals, isLoading: isHospLoading } = useCollection(assignedHospitalsQuery);
  const assignedHospitalIds = assignedHospitals?.map(h => h.id) || [];

  // 2. 전체 요청 조회 (클라이언트 사이드 필터링)
  const collectionQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('currentStatus', 'in', ['제출', '출고']),
      limit(50)
    );
  }, [firestore, user]);

  const { data: allRequests, isLoading: isReqLoading } = useCollection(collectionQuery);

  // 본인에게 배정된 병원의 요청만 필터링
  const myRequests = allRequests?.filter(r => assignedHospitalIds.includes(r.hospitalId)) || [];
  
  const collectionList = myRequests.filter(r => r.currentStatus === '제출');
  const deliveryList = myRequests.filter(r => r.currentStatus === '출고');

  if (isUserLoading || isHospLoading) return (
    <div className="p-12 text-center text-slate-400 font-bold bg-slate-900 min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-secondary" />
      <p>기사님 정보를 확인 중입니다...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <section className="flex justify-between items-end py-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">오늘의 운송 경로</h1>
          <p className="text-slate-300 text-sm font-medium">나에게 배정된 병원: <span className="text-secondary font-bold">{assignedHospitals?.length || 0}개</span></p>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-secondary font-bold text-xs">
          <Link href="/driver/hospitals">병원 관리 <ChevronRight className="h-3 w-3" /></Link>
        </Button>
      </section>

      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest px-1">
          <div className="h-2 w-2 rounded-full bg-secondary animate-pulse"></div>
          수거 대기 목록 ({collectionList.length})
        </h2>

        {isReqLoading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-3xl border border-white/5 animate-pulse">운행 데이터 로드 중...</div>
        ) : collectionList.length > 0 ? (
          <div className="space-y-4">
            {collectionList.map((req) => (
              <Card key={req.id} className="bg-slate-800 border-none shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/10">
                <CardContent className="p-0">
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white">{req.hospitalName}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-slate-300 font-medium">
                          <MapPin className="h-4 w-4 text-secondary" />
                          <span>거점 병원 (수거 요청지)</span>
                        </div>
                      </div>
                      <Badge className="bg-secondary text-secondary-foreground font-black px-3 py-1 rounded-full border-none">수거대기</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="border-white/10 bg-slate-700/50 text-white rounded-2xl gap-2 h-14 font-bold hover:bg-slate-700">
                        <Phone className="h-5 w-5" /> 연락
                      </Button>
                      <Button className="bg-secondary text-secondary-foreground rounded-2xl gap-2 h-14 font-black shadow-lg shadow-secondary/20">
                        <Navigation className="h-5 w-5" /> 길찾기
                      </Button>
                    </div>
                  </div>
                  <Link href={`/driver/collection/${req.id}`}>
                    <div className="bg-white/5 p-6 border-t border-white/5 flex items-center justify-between hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 group-hover:border-secondary/50">
                          <ClipboardCheck className="h-6 w-6 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">현장 수거 확인 시작</p>
                          <p className="text-xs text-slate-400 font-medium">수량 대조 및 이슈 보고</p>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-slate-500 group-hover:text-white" />
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-3xl border border-dashed border-white/10 font-bold">
            <Truck className="h-8 w-8 mx-auto mb-2 opacity-20" />
            배정된 수거 일정이 없습니다.
          </div>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">납품 및 출고 목록 ({deliveryList.length})</h2>
        
        <div className="space-y-3">
          {deliveryList.map((req) => (
            <Link key={req.id} href={`/driver/delivery/${req.id}`}>
              <Card className="bg-slate-800 border-none rounded-2xl ring-1 ring-white/5 hover:ring-white/20 transition-all mb-3">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/5">
                      <PackageCheck className="h-7 w-7 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-lg">{req.hospitalName}</p>
                      <p className="text-xs text-slate-300 font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full inline-block mt-1">납품/배송 대기</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-slate-600" />
                </CardContent>
              </Card>
            </Link>
          ))}
          {!isReqLoading && deliveryList.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs italic">현재 배송 예정 건이 없습니다.</div>
          )}
        </div>
      </section>
    </div>
  );
}
