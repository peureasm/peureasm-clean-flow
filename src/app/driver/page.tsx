
"use client"

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Phone, ChevronRight, ClipboardCheck, Truck, PackageCheck, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export default function DriverDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // 1. 현재 로그인한 기사(user.uid)에게 배정된 병원 목록 조회
  const assignedHospitalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'hospitals'),
      where('assignedDriverId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: assignedHospitals, isLoading: isHospLoading } = useCollection(assignedHospitalsQuery);
  
  // 병원 ID들을 추출하여 요청 쿼리에 사용
  const assignedHospitalIds = useMemoFirebase(() => {
    return assignedHospitals?.map(h => h.id) || [];
  }, [assignedHospitals]);

  // 2. 수거/납품 대기 중인 요청 조회 (배정된 병원 ID 리스트 기반)
  const collectionQuery = useMemoFirebase(() => {
    if (!firestore || !user || assignedHospitalIds.length === 0) return null;
    
    // Firestore 'in' 쿼리는 최대 30개까지 지원합니다.
    // 배정된 병원 ID들을 기준으로 필터링하여 기사 전용 데이터를 가져옵니다.
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', 'in', assignedHospitalIds.slice(0, 30)),
      limit(100)
    );
  }, [firestore, user, assignedHospitalIds]);

  const { data: allRequests, isLoading: isReqLoading } = useCollection(collectionQuery);

  // 상태 필터링 (제출=수거전, 출고=납품전)
  const collectionList = allRequests?.filter(r => r.currentStatus === '제출') || [];
  const deliveryList = allRequests?.filter(r => r.currentStatus === '출고') || [];

  if (isUserLoading || isHospLoading) return (
    <div className="p-12 text-center text-slate-400 font-bold bg-slate-900 min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-secondary" />
      <p className="text-slate-200">배정된 운송 정보를 확인 중입니다...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <section className="flex justify-between items-end py-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">운송 워크플로우</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            내 거점: <span className="text-secondary">{assignedHospitals?.length || 0}개 병원 배정됨</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-secondary font-bold text-xs">
          <Link href="/driver/hospitals">거점 정보 관리 <ChevronRight className="h-3 w-3" /></Link>
        </Button>
      </section>

      {!isHospLoading && assignedHospitalIds.length === 0 ? (
        <div className="p-12 text-center bg-slate-800/50 rounded-3xl border-2 border-dashed border-white/5 space-y-4">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
          <div>
            <p className="text-slate-200 font-black text-lg">배정된 병원이 없습니다.</p>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              본인의 ID: <span className="text-secondary font-mono">{user?.uid}</span><br/>
              관리자 페이지에서 위 ID를 병원 담당 기사로 지정해 주세요.
            </p>
          </div>
          <Button variant="outline" className="w-full border-white/10 text-white rounded-xl" onClick={() => window.location.reload()}>
            상태 새로고침
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <h2 className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em] px-1">
              <div className="h-2 w-2 rounded-full bg-secondary animate-pulse"></div>
              수거 대기 목록 ({collectionList.length})
            </h2>

            {isReqLoading ? (
              <div className="p-12 text-center text-slate-500 italic">데이터 로딩 중...</div>
            ) : collectionList.length > 0 ? (
              <div className="space-y-4">
                {collectionList.map((req) => (
                  <Card key={req.id} className="bg-slate-800 border-none shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/10">
                    <CardContent className="p-0">
                      <div className="p-6 space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white">{req.hospitalName}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                              <MapPin className="h-4 w-4 text-secondary" />
                              <span>현장 수거 위치 확인</span>
                            </div>
                          </div>
                          <Badge className="bg-secondary text-secondary-foreground font-black px-3 py-1 rounded-full border-none">수거전</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="border-white/10 bg-slate-700/50 text-white rounded-2xl gap-2 h-14 font-bold hover:bg-slate-700">
                            <Phone className="h-5 w-5" /> 연락처
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
                              <p className="text-sm font-black text-white">현장 수량 대조 시작</p>
                              <p className="text-xs text-slate-400 font-medium">병원 입력값 vs 실제 수거량</p>
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
              <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-3xl border border-dashed border-white/5">
                수거 대기 중인 요청이 없습니다.
              </div>
            )}
          </div>

          <section className="space-y-4">
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">납품 및 배송 대기 ({deliveryList.length})</h2>
            <div className="space-y-3">
              {deliveryList.map((req) => (
                <Link key={req.id} href={`/driver/delivery/${req.id}`}>
                  <Card className="bg-slate-800 border-none rounded-2xl ring-1 ring-white/5 hover:ring-secondary/20 transition-all">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/5">
                          <PackageCheck className="h-7 w-7 text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-black text-white text-lg">{req.hospitalName}</p>
                          <p className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full inline-block mt-1">최종 납품 대기</p>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-slate-600" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {deliveryList.length === 0 && (
                <div className="p-8 text-center text-slate-600 text-xs italic">배송 예정 건이 없습니다.</div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
