"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Camera, AlertCircle, CheckCircle2, Info, Package } from 'lucide-react';
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

  const updateQty = (itemId: string, val: string) => {
    const num = parseInt(val) || 0;
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, driverQty: num } : item
    ));
  };

  useEffect(() => {
    const diff = items.some(i => i.driverQty !== i.requestedQuantity);
    setHasDiscrepancy(diff);
  }, [items]);

  const handleComplete = () => {
    if (!firestore || !id) return;

    // 1. 메인 요청 상태 업데이트
    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', id as string), {
      currentStatus: '수거완료',
      discrepancyReason: hasDiscrepancy ? reason : null,
      updatedAt: new Date().toISOString()
    });

    // 2. 개별 품목 확인 수량 업데이트
    items.forEach(item => {
      updateDocumentNonBlocking(doc(firestore, `collectionRequests/${id}/items`, item.id), {
        verifiedQuantity: item.driverQty
      });
    });

    toast({
      title: "수거 완료",
      description: `${request?.hospitalName} 수거 정보가 저장되었습니다.`,
    });
    router.push('/driver');
  };

  if (isReqLoading || isItemsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 gap-6">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent shadow-xl"></div>
      <p className="text-slate-200 font-black text-lg">데이터 동기화 중...</p>
    </div>
  );

  if (!request) return <div className="p-8 text-center text-white bg-slate-900 min-h-screen font-bold">데이터를 찾을 수 없습니다.</div>;

  return (
    <div className="bg-slate-900 min-h-screen pb-32 text-slate-50">
      <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between shadow-lg">
        <Link href="/driver" className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="h-7 w-7" />
        </Link>
        <h1 className="text-lg font-black tracking-tight text-white">현장 수거 확인</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-6">
        <section className="bg-slate-800 rounded-3xl p-6 border border-white/10 shadow-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Package className="h-24 w-24 text-white" />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white">{request.hospitalName}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-300 font-bold">
                <Info className="h-4 w-4 text-secondary" />
                <span>요청 수량과 실제 수거량을 대조하세요.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">품목별 수량 입력</h3>
          {items.map((item) => {
            const diff = (item.driverQty || 0) - item.requestedQuantity;
            const itemName = item.itemName || LAUNDRY_ITEMS.find(li => li.id === item.laundryItemId)?.name || '품목명';
            
            return (
              <Card key={item.id} className={`bg-slate-800 border-none rounded-3xl overflow-hidden transition-all ring-1 ring-white/10 ${diff !== 0 ? 'ring-2 ring-orange-500 shadow-orange-500/10' : ''}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-black text-xl text-white">{itemName}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-900 text-slate-300 border-none font-bold">병원 요청: {item.requestedQuantity}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">실제 수거</Label>
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        value={item.driverQty}
                        onChange={(e) => updateQty(item.id, e.target.value)}
                        className="w-24 bg-slate-900 border-white/10 text-right font-black text-2xl h-14 rounded-2xl focus:ring-secondary text-white" 
                      />
                    </div>
                  </div>
                  {diff !== 0 && (
                    <div className="flex items-center justify-between bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20">
                      <div className="flex items-center gap-2 text-orange-400 text-sm font-black">
                        <AlertCircle className="h-5 w-5" />
                        수량 차이 발생
                      </div>
                      <div className="text-orange-400 font-black text-lg">
                        {diff > 0 ? `+${diff}` : diff} 개
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
            <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] px-2">차이 발생 사유 입력 (필수)</h3>
            <Card className="bg-slate-800 border-orange-500/30 rounded-3xl ring-2 ring-orange-500/20">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300 font-bold">구체적인 사유</Label>
                  <select 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    className="flex h-14 w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white font-bold outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="" disabled>사유를 선택해 주세요</option>
                    <option value="loss">세탁물 분실 의심</option>
                    <option value="error">병원 측 입력 오류</option>
                    <option value="damage">오염/파손으로 인한 제외</option>
                    <option value="other">기타 (직접 입력)</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="aspect-square bg-slate-900 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all cursor-pointer">
                    <Camera className="h-8 w-8" />
                    <span className="text-[10px] mt-2 font-black uppercase">사진 첨부</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="bg-slate-800/50 rounded-3xl p-6 space-y-4 border border-white/5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-secondary" />
            <p className="text-base font-black text-white">담당자 현장 확인</p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">실제 수거 수량을 병원 담당자에게 공유하고 최종 확인을 받았음을 서약합니다.</p>
          <Button variant="outline" className="w-full h-12 border-white/10 bg-transparent text-slate-200 rounded-2xl font-bold hover:bg-white/10">
            담당자 서명 / 확인 (선택)
          </Button>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 flex gap-3 z-30 max-w-lg mx-auto shadow-2xl">
        <Button 
          className="w-full h-16 rounded-2xl font-black text-lg gap-2 bg-secondary text-secondary-foreground shadow-2xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all hover:bg-secondary/90"
          onClick={handleComplete}
          disabled={hasDiscrepancy && (!reason)}
        >
          수거 완료 및 저장
        </Button>
      </div>
    </div>
  );
}
