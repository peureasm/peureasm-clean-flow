
"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Truck, Package, Info, CheckCircle2, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { LAUNDRY_ITEMS } from '@/app/lib/data';

export default function DriverDeliveryDetail() {
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

  // 납품 가능 상태: '출고' 상태일 때만 수정 가능
  const isReadOnly = request && request.currentStatus !== '출고';

  useEffect(() => {
    if (dbItems) {
      setItems(dbItems.map(i => ({ 
        ...i, 
        deliveryQty: i.deliveredQuantity !== undefined ? i.deliveredQuantity : (i.verifiedQuantity || i.requestedQuantity)
      })));
    }
  }, [dbItems]);

  const updateQty = (itemId: string, val: string) => {
    if (isReadOnly) return;
    const num = parseInt(val) || 0;
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, deliveryQty: num } : item
    ));
  };

  const handleComplete = () => {
    if (!firestore || !id || isReadOnly) return;

    // 1. 메인 요청 상태 업데이트
    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', id as string), {
      currentStatus: '납품완료',
      updatedAt: new Date().toISOString()
    });

    // 2. 개별 품목 최종 납품 수량 업데이트
    items.forEach(item => {
      updateDocumentNonBlocking(doc(firestore, `collectionRequests/${id}/items`, item.id), {
        deliveredQuantity: item.deliveryQty
      });
    });

    toast({
      title: "납품 처리 완료",
      description: `${request?.hospitalName} 납품이 정상적으로 기록되었습니다.`,
    });
    router.push('/driver');
  };

  if (isReqLoading || isItemsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-secondary" />
      <p className="text-muted-foreground font-bold">배송 데이터 로드 중...</p>
    </div>
  );

  if (!request) return <div className="p-8 text-center text-muted-foreground font-bold min-h-screen">데이터를 찾을 수 없습니다.</div>;

  return (
    <div className="bg-background min-h-screen pb-48">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
        <Link href="/driver" className="p-2 hover:bg-muted rounded-full transition-colors">
          <ChevronLeft className="h-7 w-7 text-slate-600" />
        </Link>
        <h1 className="text-lg font-black tracking-tight text-foreground">최종 납품 확인</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-6">
        {isReadOnly && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-3">
            <Lock className="h-5 w-5 text-accent" />
            <div className="flex-1">
              <p className="text-xs font-bold">기록 완료 (수정 불가)</p>
              <p className="text-[10px] opacity-70">납품 처리가 이미 완료되었거나 요청이 종료된 상태입니다.</p>
            </div>
          </div>
        )}

        <section className="bg-secondary/5 rounded-3xl p-6 border border-secondary/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Truck className="h-24 w-24 text-secondary" />
          </div>
          <div className="relative z-10 space-y-2">
            <h2 className="text-2xl font-black text-foreground">{request.hospitalName}</h2>
            <div className="flex items-center gap-2 text-sm text-secondary font-bold">
              <Info className="h-4 w-4" />
              <span>병원 도착 시 최종 납품 수량을 입력하세요.</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">납품 수량 입력</h3>
          {items.map((item) => {
            const itemName = item.itemName || LAUNDRY_ITEMS.find(li => li.id === item.laundryItemId)?.name || '품목명';
            return (
              <Card key={item.id} className="bg-white border-none rounded-3xl overflow-hidden ring-1 ring-border">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-black text-xl text-foreground">{itemName}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-muted/50 text-slate-400 border-none text-[10px]">수거: {item.verifiedQuantity || 0}</Badge>
                        <Badge variant="secondary" className="bg-secondary/5 text-secondary border-none text-[10px]">입고: {item.inboundQuantity || item.verifiedQuantity || 0}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">최종 납품</Label>
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        disabled={isReadOnly}
                        value={item.deliveryQty}
                        onChange={(e) => updateQty(item.id, e.target.value)}
                        className="w-24 bg-muted/30 border-border text-right font-black text-2xl h-14 rounded-2xl text-secondary focus:ring-secondary disabled:opacity-50" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="bg-white rounded-3xl p-6 space-y-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-secondary" />
            <p className="text-base font-black text-foreground">병원 담당자 확인</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">납품 시 병원 담당자와 수량을 대조하고 최종 확인을 받았음을 서약합니다.</p>
        </section>
      </div>

      {!isReadOnly && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-border flex gap-3 z-30 max-w-lg mx-auto">
          <Button 
            className="w-full h-16 rounded-2xl font-black text-lg gap-2 bg-secondary text-white shadow-2xl shadow-secondary/20 hover:bg-secondary/90 transition-all"
            onClick={handleComplete}
          >
            납품 완료 처리
          </Button>
        </div>
      )}
    </div>
  );
}
