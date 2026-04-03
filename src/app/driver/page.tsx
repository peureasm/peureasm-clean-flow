
"use client"

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Phone, ChevronRight, ClipboardCheck, PackageCheck, Loader2, AlertCircle, Sparkles, Truck, History, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, limit, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';

export default function DriverDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);

  // 1. 현재 로그인한 기사(user.uid)에게 배정된 병원 목록 조회
  const assignedHospitalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'hospitals'),
      where('assignedDriverId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: assignedHospitals, isLoading: isHospLoading } = useCollection(assignedHospitalsQuery);
  
  const assignedHospitalIds = useMemoFirebase(() => {
    return assignedHospitals?.map(h => h.id) || [];
  }, [assignedHospitals]);

  // 2. 수거/납품 대기 중인 요청 조회
  const collectionQuery = useMemoFirebase(() => {
    if (!firestore || !user || assignedHospitalIds.length === 0) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', 'in', assignedHospitalIds.slice(0, 30)),
      limit(100)
    );
  }, [firestore, user, assignedHospitalIds]);

  const { data: allRequests, isLoading: isReqLoading } = useCollection(collectionQuery);

  const handleLinkTestDriver = () => {
    if (!firestore || !user) return;
    setIsLinking(true);
    
    setDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      id: user.uid,
      role: 'DRIVER',
      name: user.displayName || '테스트 기사님',
      isActive: true,
      updatedAt: serverTimestamp()
    }, { merge: true });

    const testHospRef = doc(firestore, 'hospitals', 'test-hosp-id');
    updateDocumentNonBlocking(testHospRef, {
      assignedDriverId: user.uid,
      assignedDriverName: user.displayName || '테스트 기사님',
      updatedAt: serverTimestamp()
    });

    toast({ title: "테스트 기사 연결", description: "테스트 병원 배정 요청이 완료되었습니다." });
    setIsLinking(false);
  };

  const collectionList = allRequests?.filter(r => r.currentStatus === '제출') || [];
  const deliveryList = allRequests?.filter(r => r.currentStatus === '출고') || [];
  const recentHistory = allRequests?.filter(r => ['수거완료', '납품완료', '병원확인완료', '종결'].includes(r.currentStatus)).slice(0, 3) || [];

  if (isUserLoading || isHospLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-secondary" />
      <p className="text-muted-foreground font-bold text-sm">운송 정보 확인 중...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <section className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-24px font-black text-foreground">현장 운송 현황</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            내 거점: <span className="text-secondary">{assignedHospitals?.length || 0}개 병원 배정됨</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-secondary font-black text-xs hover:bg-accent rounded-full px-4">
          <Link href="/driver/hospitals">거점 관리 <ChevronRight className="h-3 w-3 ml-1" /></Link>
        </Button>
      </section>

      {!isHospLoading && assignedHospitalIds.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-border shadow-sm space-y-8">
          <div className="space-y-4">
            <div className="h-20 w-20 bg-accent rounded-full flex items-center justify-center text-secondary mx-auto">
              <Truck className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-black text-xl">배정된 병원이 없습니다</p>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                관리자가 배정한 수거 거점 정보가 없습니다.<br/>
                테스트를 위해 아래 버튼으로 시작해 보세요.
              </p>
            </div>
          </div>
          <Button 
            onClick={handleLinkTestDriver}
            disabled={isLinking}
            className="w-full h-16 rounded-2xl bg-secondary text-white font-black text-lg gap-3 shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-all"
          >
            {isLinking ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6 text-accent" />}
            테스트 기사로 즉시 시작
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase flex items-center gap-2 tracking-widest px-1">
              <div className="h-2 w-2 rounded-full bg-secondary"></div>
              수거 대기 목록 ({collectionList.length})
            </h2>

            {isReqLoading ? (
              <div className="p-12 text-center text-slate-300 italic font-bold">데이터 로딩 중...</div>
            ) : collectionList.length > 0 ? (
              <div className="space-y-4">
                {collectionList.map((req) => (
                  <Card key={req.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-border">
                    <CardContent className="p-0">
                      <div className="p-6 space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="text-xl font-black text-foreground">{req.hospitalName}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                              <MapPin className="h-3.5 w-3.5 text-secondary" />
                              <span>수거 거점 위치 확인</span>
                            </div>
                          </div>
                          <Badge className="bg-secondary/10 text-secondary border-none font-bold rounded-full">수거전</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="border-border bg-white text-foreground rounded-xl gap-2 h-12 font-bold hover:bg-muted">
                            <Phone className="h-4 w-4" /> 연락처
                          </Button>
                          <Button className="bg-secondary text-white rounded-xl gap-2 h-12 font-bold shadow-md shadow-secondary/10">
                            <Navigation className="h-4 w-4" /> 길찾기
                          </Button>
                        </div>
                      </div>
                      <Link href={`/driver/collection/${req.id}`}>
                        <div className="bg-accent/30 p-5 flex items-center justify-between hover:bg-accent/50 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-border group-hover:border-secondary transition-colors shadow-sm">
                              <ClipboardCheck className="h-6 w-6 text-secondary" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground">현장 수량 대조 시작</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Quantity Verification</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-border font-bold">
                대기 중인 수거 건이 없습니다.
              </div>
            )}
          </div>

          <section className="space-y-4">
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest px-1">배송 및 납품 대기 ({deliveryList.length})</h2>
            <div className="space-y-3">
              {deliveryList.map((req) => (
                <Link key={req.id} href={`/driver/delivery/${req.id}`}>
                  <Card className="border-none shadow-sm rounded-2xl bg-white ring-1 ring-border hover:ring-secondary/30 transition-all group">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/10">
                          <PackageCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{req.hospitalName}</p>
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest">Outbound Delivery</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Link>
                ))}
                {deliveryList.length === 0 && (
                  <div className="p-10 text-center text-slate-300 text-xs italic font-bold">배송 예정인 건이 없습니다.</div>
                )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">최근 운송 요약</h2>
              <Link href="/driver/history" className="text-[10px] font-black text-secondary uppercase flex items-center gap-1">전체 이력 <ChevronRight className="h-3 w-3" /></Link>
            </div>
            <div className="space-y-2">
              {recentHistory.length > 0 ? recentHistory.map((req) => (
                <Card key={req.id} className="border-none shadow-none bg-slate-50/50 rounded-2xl ring-1 ring-slate-100">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-100">
                        <History className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{req.hospitalName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{req.requestDate}</p>
                      </div>
                    </div>
                    <StatusBadge status={req.currentStatus} />
                  </CardContent>
                </Card>
              )) : (
                <p className="text-center py-6 text-xs text-slate-300 italic">최근 이력이 없습니다.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
