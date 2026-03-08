
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Hospital, MapPin, Phone, User, Calendar, History, ExternalLink, Navigation } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';

export default function DriverHospitalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();

  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'hospitals', id as string);
  }, [firestore, id]);

  const { data: hospital, isLoading: isHospLoading } = useDoc(hospitalRef);

  // 해당 병원의 최근 요청 이력 조회
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', '==', id),
      limit(10)
    );
  }, [firestore, id]);

  const { data: history, isLoading: isHistoryLoading } = useCollection(historyQuery);

  if (isHospLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-secondary border-t-transparent shadow-xl"></div>
      <p className="text-slate-400 font-bold">병원 정보를 불러오는 중...</p>
    </div>
  );

  if (!hospital) return (
    <div className="p-8 text-center text-white bg-slate-900 min-h-screen">
      <p className="font-bold">병원을 찾을 수 없습니다.</p>
      <Button onClick={() => router.back()} className="mt-4 bg-secondary text-secondary-foreground">뒤로 가기</Button>
    </div>
  );

  return (
    <div className="bg-slate-900 min-h-screen pb-20 text-slate-50">
      <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-white">
          <ChevronLeft className="h-7 w-7" />
        </Button>
        <h1 className="text-lg font-black tracking-tight text-white">병원 상세 정보</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-6">
        <section className="bg-slate-800 rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-secondary text-secondary-foreground rounded-2xl">
              <Hospital className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{hospital.name}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Master Identity</p>
            </div>
          </div>

          <div className="grid gap-4 pt-4 border-t border-white/5">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-secondary mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">주소</p>
                <p className="text-sm font-bold text-slate-200">{hospital.address}</p>
                <Button variant="link" className="p-0 h-auto text-xs text-secondary font-bold flex items-center gap-1 mt-1">
                  <Navigation className="h-3 w-3" /> 내비게이션 연결
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-secondary mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">담당자</p>
                  <p className="text-sm font-bold text-slate-200">{hospital.contactPersonName || '정보 없음'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-secondary mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">연락처</p>
                  <p className="text-sm font-bold text-slate-200">{hospital.contactPersonPhone || '정보 없음'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <History className="h-4 w-4" /> 최근 세탁 공정 이력
            </h3>
          </div>
          
          <div className="space-y-3">
            {isHistoryLoading ? (
              <div className="p-12 text-center animate-pulse bg-slate-800/50 rounded-3xl">이력 로딩 중...</div>
            ) : history && history.length > 0 ? (
              history.map((req) => (
                <Card key={req.id} className="bg-slate-800 border-none rounded-2xl ring-1 ring-white/5 overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-white">{req.requestDate}</p>
                      <StatusBadge status={req.currentStatus as any} />
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
                      <Link href={`/driver/${req.currentStatus === '출고' || req.currentStatus === '납품완료' ? 'delivery' : 'collection'}/${req.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs italic bg-slate-800/30 rounded-3xl">최근 세탁 이력이 없습니다.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
