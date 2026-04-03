
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
import { ChevronLeft, CheckCircle2, AlertCircle, Info, PackageSearch, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function FactoryInboundDetailPage() {
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

  // 입고 수정 가능 상태: '수거완료' 단계일 때만 실입고 수량 수정 가능
  const isReadOnly = request && request.currentStatus !== '수거완료';

  useEffect(() => {
    if (dbItems) {
      setItems(dbItems.map(i => ({ 
        ...i, 
        inboundQty: i.inboundQuantity !== undefined ? i.inboundQuantity : (i.verifiedQuantity || i.requestedQuantity)
      })));
    }
  }, [dbItems]);

  const updateQty = (itemId: string, val: string) => {
    if (isReadOnly) return;
    const num = parseInt(val) || 0;
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, inboundQty: num } : item
    ));
  };

  const handleComplete = () => {
    if (!firestore || !id || isReadOnly) return;

    // 1. 요청 상태를 '공장입고'로 업데이트
    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', id as string), {
      currentStatus: '공장입고',
      inboundAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 2. 개별 품목 공장 입고 수량 저장
    items.forEach(item => {
      updateDocumentNonBlocking(doc(firestore, `collectionRequests/${id}/items`, item.id), {
        inboundQuantity: item.inboundQty
      });
    });

    toast({
      title: "입고 처리 완료",
      description: `${request?.hospitalName}의 세탁물이 정상 입고되었습니다.`,
    });
    router.push('/factory');
  };

  if (isReqLoading || isItemsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent shadow-xl"></div>
      <p className="text-slate-400 font-bold">입고 데이터를 동기화 중...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="rounded-xl">
          <Link href="/factory/inbound"><ChevronLeft className="h-4 w-4 mr-1" /> 입고 대기 목록으로</Link>
        </Button>
        <Badge className="bg-purple-100 text-purple-700 border-none font-bold">공장 입고 검수 단계</Badge>
      </div>

      {isReadOnly && (
        <div className="bg-slate-900 text-white p-5 rounded-3xl flex items-center gap-4">
          <Lock className="h-6 w-6 text-accent" />
          <div>
            <p className="text-sm font-bold">확정된 입고 건 (수정 불가)</p>
            <p className="text-xs opacity-60">공장 입고 검수가 완료되어 이미 세탁 공정이 진행 중입니다.</p>
          </div>
        </div>
      )}

      <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-700 rounded-2xl">
            <PackageSearch className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{request?.hospitalName}</h2>
            <p className="text-sm text-muted-foreground font-medium">수거 완료된 세탁물의 실물 수량을 최종 확인하세요.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">품목별 실물 대조</h3>
        <div className="space-y-3">
          {items.map((item) => {
            const diff = item.inboundQty - (item.verifiedQuantity || item.requestedQuantity);
            return (
              <Card key={item.id} className={`rounded-3xl border-none shadow-sm transition-all ${diff !== 0 ? 'ring-2 ring-orange-500' : 'bg-white'}`}>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="font-black text-slate-800 text-lg">{item.itemName}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold text-[10px]">기사 확인: {item.verifiedQuantity || item.requestedQuantity}</Badge>
                      {diff !== 0 && (
                        <Badge className="bg-orange-500 text-white border-none font-black text-[10px]">차이 발생</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">공장 실입고량</Label>
                    <Input 
                      type="number" 
                      disabled={isReadOnly}
                      value={item.inboundQty}
                      onChange={(e) => updateQty(item.id, e.target.value)}
                      className="w-24 bg-white border-none text-right font-black text-xl h-10 rounded-xl focus:ring-purple-500 disabled:opacity-50" 
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-purple-50 rounded-3xl p-6 border border-purple-100 flex gap-4">
        <Info className="h-6 w-6 text-purple-600 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-purple-900">주의사항</p>
          <p className="text-xs text-purple-700 leading-relaxed">
            공장 입고량이 확정되면 즉시 세탁 공정(Kanban)으로 이동됩니다. 기사 확인량과 차이가 있을 경우 관리자 대시보드에 알림이 전송됩니다.
          </p>
        </div>
      </section>

      {!isReadOnly && (
        <div className="pt-6">
          <Button 
            className="w-full h-16 rounded-2xl bg-purple-700 text-white font-black text-lg shadow-xl shadow-purple-200 hover:bg-purple-800"
            onClick={handleComplete}
          >
            검수 완료 및 입고 확정
          </Button>
        </div>
      )}
    </div>
  );
}
