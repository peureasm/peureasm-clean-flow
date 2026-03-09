
"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Camera, AlertCircle, CheckCircle2, Info, Package, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { LAUNDRY_ITEMS } from '@/app/lib/data';

export default function DriverCollectionDetail() {
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
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (dbItems) {
      setItems(dbItems.map(i => ({ 
        ...i, 
        driverQty: i.verifiedQuantity !== undefined ? i.verifiedQuantity : i.requestedQuantity 
      })));
    }
  }, [dbItems]);

  const updateQty = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, driverQty: Math.max(0, item.driverQty + delta) } : item
    ));
  };

  useEffect(() => {
    const diff = items.some(i => i.driverQty !== i.requestedQuantity);
    setHasDiscrepancy(diff);
  }, [items]);

  const handleComplete = () => {
    if (!firestore || !id) return;

    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', id as string), {
      currentStatus: '수거완료',
      discrepancyReason: hasDiscrepancy ? reason : null,
      updatedAt: new Date().toISOString()
    });

    items.forEach(item => {
      updateDocumentNonBlocking(doc(firestore, `collectionRequests/${id}/items`, item.id), {
        verifiedQuantity: item.driverQty
      });
    });

    toast({
      title: "수거 정보 저장 완료",
      description: `${request?.hospitalName} 수거가 완료되었습니다.`,
    });
    router.push('/driver');
  };

  if (isReqLoading || isItemsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-secondary" />
      <p className="text-muted-foreground font-bold">수거 데이터를 불러오는 중...</p>
    </div>
  );

  if (!request) return <div className="p-8 text-center text-muted-foreground font-bold">데이터를 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen pb-32 bg-background">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
        <Link href="/driver" className="p-2 hover:bg-muted rounded-full transition-colors">
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </Link>
        <h1 className="text-lg font-black tracking-tight text-foreground">현장 수거 검수</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-8">
        <section className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Package className="h-20 w-20 text-secondary" />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-black text-secondary uppercase tracking-widest bg-secondary/5 px-2 py-0.5 rounded-full border border-secondary/10">Verification Mode</span>
            <h2 className="text-2xl font-black text-foreground mt-2">{request.hospitalName}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mt-1">
              <Info className="h-3.5 w-3.5 text-secondary" />
              <span>병원 입력 수량과 실물 수량을 대조하세요.</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest px-1">품목별 수량 확정</h3>
          {items.map((item) => {
            const diff = (item.driverQty || 0) - item.requestedQuantity;
            const itemName = item.itemName || LAUNDRY_ITEMS.find(li => li.id === item.laundryItemId)?.name || '품목명';
            
            return (
              <Card key={item.id} className={`bg-white border-none shadow-sm rounded-3xl overflow-hidden ring-1 transition-all ${diff !== 0 ? 'ring-2 ring-orange-500' : 'ring-border'}`}>
                <CardContent className="p-6 space-y-5">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-black text-lg text-foreground">{itemName}</p>
                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border font-bold">병원 요청: {item.requestedQuantity}</Badge>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-2xl border border-border">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl bg-white shadow-sm border border-border text-foreground hover:bg-muted"
                        onClick={() => updateQty(item.id, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-black text-2xl text-secondary">{item.driverQty}</span>
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl bg-white shadow-sm border border-border text-foreground hover:bg-muted"
                        onClick={() => updateQty(item.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {diff !== 0 && (
                    <div className="flex items-center justify-between bg-orange-50 p-3 rounded-2xl border border-orange-100">
                      <div className="flex items-center gap-2 text-orange-600 text-[11px] font-black uppercase">
                        <AlertCircle className="h-4 w-4" />
                        수량 불일치 감지 (Δ)
                      </div>
                      <div className="text-orange-600 font-black text-lg">
                        {diff > 0 ? `+${diff}` : diff} <span className="text-xs">개</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        {hasDiscrepancy && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-[12px] font-bold text-orange-600 uppercase tracking-widest px-1">차이 발생 사유 (필수)</h3>
            <Card className="bg-white border-none shadow-sm rounded-3xl ring-2 ring-orange-500/20">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-bold">불일치 상세 사유 선택</Label>
                  <select 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-2 text-foreground font-bold outline-none focus:ring-2 focus:ring-secondary transition-all"
                  >
                    <option value="" disabled>사유를 선택해 주세요</option>
                    <option value="loss">세탁물 분실 의심</option>
                    <option value="error">병원 측 입력 오류</option>
                    <option value="damage">오염/파손으로 인한 제외</option>
                    <option value="other">기타 (직접 입력)</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="aspect-square bg-muted/30 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-border text-slate-400 hover:text-secondary hover:border-secondary/30 transition-all cursor-pointer group">
                    <Camera className="h-8 w-8 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] mt-2 font-black uppercase">증빙 촬영</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="bg-white rounded-3xl p-6 space-y-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-secondary" />
            <p className="text-base font-black text-foreground">현장 담당자 구두 확인</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">수정된 수거량을 병원 담당자에게 공유하고 최종 확인을 받았음을 서약합니다.</p>
          <Button variant="outline" className="w-full h-12 border-border bg-muted/20 text-muted-foreground rounded-xl font-bold hover:bg-muted hover:text-foreground">
            담당자 서명 받기 (선택)
          </Button>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t flex gap-3 z-30 max-w-lg mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <Button 
          className="w-full h-16 rounded-2xl font-black text-lg gap-2 bg-secondary text-white shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
          onClick={handleComplete}
          disabled={hasDiscrepancy && (!reason)}
        >
          수거 검수 완료 및 저장
        </Button>
      </div>
    </div>
  );
}
