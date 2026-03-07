
"use client"

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Clock, Package, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';

export default function HospitalRequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();

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

  if (isReqLoading || isItemsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">요청 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <p className="font-bold">요청을 찾을 수 없습니다.</p>
        <Button onClick={() => router.push('/hospital')}>목록으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen pb-20">
      <div className="sticky top-0 z-20 bg-white border-b p-4 flex items-center justify-between">
        <Link href="/hospital/requests" className="p-1">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold">요청 상세 정보</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-6">
        <section className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
                {request.id}
              </span>
              <h2 className="text-xl font-bold">{request.hospitalName}</h2>
              <p className="text-sm text-muted-foreground">{request.requestDate} 수거 예정</p>
            </div>
            <StatusBadge status={request.currentStatus as any} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
            <Package className="h-4 w-4" /> 요청 품목 내역
          </h3>
          <div className="space-y-3">
            {items?.map((item) => (
              <Card key={item.id} className="rounded-2xl border-none shadow-sm">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{item.itemName || '품목명 없음'}</p>
                    <p className="text-xs text-muted-foreground">ID: {item.laundryItemId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">{item.requestedQuantity}개</p>
                    {item.verifiedQuantity !== undefined && (
                      <p className="text-[10px] font-bold text-emerald-600">수거확인: {item.verifiedQuantity}개</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
            <FileText className="h-4 w-4" /> 요청 정보 및 특이사항
          </h3>
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">희망 수거 시간</p>
                  <p className="font-medium">{request.desiredPickupTime}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">등록 일시</p>
                  <p className="font-medium">{new Date(request.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="pt-2 border-t space-y-2">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">체크 리스트</p>
                <div className="flex flex-wrap gap-2">
                  {request.isContaminated && <Badge variant="destructive" className="rounded-lg">오염물 주의</Badge>}
                  {request.isLeaking && <Badge variant="destructive" className="rounded-lg">누수 주의</Badge>}
                  {request.isDoublePacked && <Badge className="bg-blue-500 rounded-lg">이중 포장</Badge>}
                  {request.hasLabels && <Badge className="bg-emerald-500 rounded-lg">라벨링 완료</Badge>}
                </div>
              </div>
              {request.specialNotes && (
                <div className="pt-2 border-t space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">메모</p>
                  <p className="text-sm bg-slate-50 p-3 rounded-xl">{request.specialNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
            <Clock className="h-4 w-4" /> 진행 타임라인
          </h3>
          <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
            <div className="relative">
              <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-white"></div>
              <div>
                <p className="text-xs font-bold">{request.currentStatus}</p>
                <p className="text-[10px] text-muted-foreground">현재 상태</p>
              </div>
            </div>
            <div className="relative opacity-50">
              <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-300 border-2 border-white"></div>
              <div>
                <p className="text-xs font-bold">요청 제출됨</p>
                <p className="text-[10px] text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t flex gap-3 z-30 max-w-lg mx-auto">
        <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => router.push('/hospital/requests')}>
          목록으로
        </Button>
        <Button className="flex-1 h-12 rounded-xl font-bold bg-primary" onClick={() => window.print()}>
          영수증 출력
        </Button>
      </div>
    </div>
  );
}
