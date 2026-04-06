
"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, CheckCircle2, AlertCircle, Info, PackageCheck, Lock, Truck, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function FactoryOutboundDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
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
  const { data: dbItems, isLoading: isItemsLoading } = useCollection(itemsQuery);

  const [items, setItems] = useState<any[]>([]);

  // 출고 수정 가능 상태: '포장완료' 단계일 때만 출고 수량 수정 가능
  const isReadOnly = request && request.currentStatus !== '포장완료';

  useEffect(() => {
    if (dbItems) {
      setItems(dbItems.map(i => ({ 
        ...i, 
        outboundQty: i.inboundQuantity !== undefined ? i.inboundQuantity : (i.verifiedQuantity || i.requestedQuantity)
      })));
    }
  }, [dbItems]);

  const updateQty = (itemId: string, val: string) => {
    if (isReadOnly) return;
    const num = parseInt(val) || 0;
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, outboundQty: Math.max(0, num) } : item
    ));
  };

  const handleComplete = () => {
    if (!firestore || !id || isReadOnly) return;

    // 1. 요청 상태를 '출고'로 업데이트
    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', id as string), {
      currentStatus: '출고',
      outboundAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 2. 개별 품목 최종 출고 수량 저장 (추후 납품 시 기사가 확인하기 위함)
    // 여기서는 outboundQty가 결국 factory에서 나가는 양이므로 inboundQuantity와 비교하여 차이를 확인합니다.
    items.forEach(item => {
      // deliveredQuantity의 초기값을 outboundQty로 설정해둡니다.
      updateDocumentNonBlocking(doc(firestore, `collectionRequests/${id}/items`, item.id), {
        outboundQuantity: item.outboundQty,
        // 기사에게 넘겨줄 때의 기본값을 미리 설정 (기사가 수정 가능)
        deliveredQuantity: item.outboundQty 
      });
    });

    toast({
      title: "출고 처리 완료",
      description: `${request?.hospitalName}의 세탁물이 배송 대기 상태(출고)로 전환되었습니다.`,
    });
    router.push('/factory/outbound');
  };

  if (isReqLoading || isItemsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-xl"></div>
      <p className="text-slate-400 font-bold">출고 데이터를 동기화 중...</p>
    </div>
  );

  if (!request) return <div className="p-20 text-center font-bold text-slate-400">요청 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-white">
          <Link href="/factory/outbound"><ChevronLeft className="h-4 w-4 mr-1" /> 출고 대기 목록으로</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold px-3 py-1">최종 출고 검수</Badge>
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-slate-900 text-white p-6 rounded-[32px] flex items-center gap-4 shadow-2xl">
          <Lock className="h-8 w-8 text-indigo-400" />
          <div>
            <p className="text-lg font-black tracking-tight">확정된 출고 건 (수정 불가)</p>
            <p className="text-sm opacity-60 font-medium">이미 기사 인계가 완료되었거나 배송 중인 상태입니다.</p>
          </div>
        </div>
      )}

      <section className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Truck className="h-32 w-32 text-indigo-600" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="p-5 bg-indigo-50 text-indigo-700 rounded-3xl">
            <PackageCheck className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{request.hospitalName}</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground font-bold">
              <span className="flex items-center gap-1"><History className="h-3.5 w-3.5" /> 수거일: {request.requestDate}</span>
              <span className="h-3 w-px bg-slate-200" />
              <span className="text-indigo-600">ID: {request.id.slice(-8).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">품목별 최종 인계 수량</h3>
          <p className="text-[10px] font-bold text-slate-400 italic">* 입고량과 대조하여 최종 수량을 입력하세요.</p>
        </div>
        <div className="space-y-4">
          {items.map((item) => {
            const diff = item.outboundQty - (item.inboundQuantity || item.verifiedQuantity || item.requestedQuantity);
            return (
              <Card key={item.id} className={`rounded-[32px] border-none shadow-sm transition-all overflow-hidden ${diff !== 0 ? 'ring-2 ring-orange-500 bg-orange-50/10' : 'bg-white ring-1 ring-slate-100'}`}>
                <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-2">
                    <p className="font-black text-slate-900 text-xl tracking-tight">{item.itemName}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-bold text-[10px]">입고: {item.inboundQuantity || 0}</Badge>
                      {diff !== 0 && (
                        <Badge className="bg-orange-500 text-white border-none font-black text-[10px] animate-pulse">수량 차이 감지 (Δ {diff > 0 ? `+${diff}` : diff})</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-5 bg-white p-4 rounded-3xl border border-slate-100 shadow-inner min-w-[200px] justify-between">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">최종 출고량</Label>
                    <div className="flex items-center gap-3">
                      <Input 
                        type="number" 
                        disabled={isReadOnly}
                        value={item.outboundQty}
                        onChange={(e) => updateQty(item.id, e.target.value)}
                        className="w-24 bg-slate-50 border-none text-right font-black text-2xl h-12 rounded-xl focus:ring-indigo-500 disabled:opacity-50 text-indigo-700" 
                      />
                      <span className="text-slate-400 font-bold text-sm">개</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-indigo-50/50 rounded-[32px] p-8 border border-indigo-100/50 flex gap-5 items-start">
        <div className="p-2 bg-indigo-100 rounded-full">
          <Info className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-black text-indigo-900">출고 전 안내사항</p>
          <p className="text-sm text-indigo-700/80 leading-relaxed font-medium">
            최종 출고량이 확정되면 기사님께 배송 정보가 실시간으로 전송됩니다. 
            차이가 있는 품목은 병원 및 관리자 대시보드에 리포팅되오니, 실물 수량을 다시 한번 확인해 주시기 바랍니다.
          </p>
        </div>
      </section>

      {!isReadOnly && (
        <div className="pt-6">
          <Button 
            className="w-full h-20 rounded-[24px] bg-indigo-600 text-white font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.01] transition-all active:scale-95"
            onClick={handleComplete}
          >
            검수 완료 및 출고 확정
          </Button>
        </div>
      )}
    </div>
  );
}
