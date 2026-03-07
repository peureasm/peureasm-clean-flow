
"use client"

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Clock, Package, CheckCircle2, AlertCircle, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import { useDoc, useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function HospitalRequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'collectionRequests', id as string);
  }, [firestore, id]);

  const itemsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return collection(firestore, `collectionRequests/${id}/items`);
  }, [firestore, id]);

  const { data: request, isLoading: isReqLoading } = useDoc(requestRef);
  const { data: items, isLoading: isItemsLoading } = useCollection(itemsQuery);

  const handleFinalConfirm = () => {
    if (!firestore || !id) return;
    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', id as string), {
      currentStatus: '병원확인완료',
      finalConfirmedAt: new Date().toISOString()
    });
    toast({
      title: "납품 확인 완료",
      description: "세탁물 납품을 확인하였습니다. 정산 절차로 진행됩니다.",
    });
  };

  if (isReqLoading || isItemsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm font-bold text-muted-foreground">세탁물 추적 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center space-y-4 bg-white min-h-screen">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
        <p className="font-bold text-xl">요청을 찾을 수 없습니다.</p>
        <Button onClick={() => router.push('/hospital')} className="rounded-2xl h-12 px-8">목록으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-[#F8FAFC] min-h-screen pb-32">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
        <Link href="/hospital/requests" className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-slate-900">세탁물 추적 정보</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-6">
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 uppercase tracking-widest">
                ID: {request.id.slice(-12)}
              </span>
              <h2 className="text-2xl font-black text-slate-900">{request.hospitalName}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>요청일: {request.requestDate}</span>
              </div>
            </div>
            <StatusBadge status={request.currentStatus as any} />
          </div>
          
          {request.currentStatus === '납품완료' && (
            <Card className="bg-primary/5 border-primary/20 rounded-2xl p-4 border-2 border-dashed">
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-bold text-primary">세탁물이 병원에 도착했습니다!</p>
                  <p className="text-xs text-slate-600">수량을 확인하고 '최종 납품 확인' 버튼을 눌러주세요.</p>
                  <Button onClick={handleFinalConfirm} className="w-full h-10 rounded-xl bg-primary text-white font-bold">최종 납품 확인</Button>
                </div>
              </div>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
            <Package className="h-4 w-4" /> 수량 추적 내역
          </h3>
          <div className="space-y-3">
            {items?.map((item) => (
              <Card key={item.id} className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-black text-slate-900 text-lg">{item.itemName || '품목명 없음'}</p>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">요청 수량</p>
                      <p className="text-xl font-black text-primary">{item.requestedQuantity}<span className="text-xs ml-0.5 font-bold">개</span></p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">실제 수거</p>
                      <p className="text-sm font-black text-emerald-600">{item.verifiedQuantity ?? '-'}개</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">최종 납품</p>
                      <p className="text-sm font-black text-indigo-600">{item.deliveredQuantity ?? '-'}개</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
            <History className="h-4 w-4" /> 실시간 타임라인
          </h3>
          <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
              <div className="relative">
                <div className="absolute -left-[33px] top-1 h-5 w-5 rounded-full bg-primary border-4 border-white shadow-sm z-10"></div>
                <div>
                  <p className="text-sm font-black text-slate-900">{request.currentStatus}</p>
                  <p className="text-xs text-muted-foreground">{new Date(request.updatedAt || request.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="relative opacity-40">
                <div className="absolute -left-[33px] top-1 h-5 w-5 rounded-full bg-slate-200 border-4 border-white z-10"></div>
                <div>
                  <p className="text-sm font-bold text-slate-700">요청 생성 및 제출</p>
                  <p className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t flex gap-3 z-30 max-w-lg mx-auto">
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-slate-200" onClick={() => router.push('/hospital/requests')}>
          목록으로
        </Button>
        <Button className="flex-1 h-14 rounded-2xl font-bold bg-slate-900 text-white shadow-xl" onClick={() => window.print()}>
          인증서 출력
        </Button>
      </div>
    </div>
  );
}

function History({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
    </svg>
  );
}
