
"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Camera, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';

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

  const updateQty = (id: string, val: string) => {
    const num = parseInt(val) || 0;
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, driverQty: num } : item
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
      description: `${request?.hospitalName} 수거 정보가 Firestore에 저장되었습니다.`,
    });
    router.push('/driver');
  };

  if (isReqLoading || isItemsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      <p className="text-gray-400">현장 정보를 불러오는 중입니다...</p>
    </div>
  );

  if (!request) return <div className="p-8 text-center text-white bg-gray-900 min-h-screen">요청을 찾을 수 없습니다.</div>;

  return (
    <div className="bg-gray-900 min-h-screen pb-32 text-white">
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-white/10 p-4 flex items-center justify-between">
        <Link href="/driver" className="p-1">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold">수거 현장 확인</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-6">
        <section className="bg-gray-800 rounded-2xl p-4 border border-white/5 space-y-2">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">{request.hospitalName}</h2>
            <Badge variant="outline" className="border-secondary text-secondary">수거단계</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Info className="h-3 w-3" />
            <span>병원 측에서 입력한 수량을 현장에서 다시 확인해주세요.</span>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase px-1">품목별 수량 대조</h3>
          {items.map((item) => {
            const diff = (item.driverQty || 0) - item.requestedQuantity;
            return (
              <Card key={item.id} className={`bg-gray-800 border-none rounded-2xl overflow-hidden transition-all ${diff !== 0 ? 'ring-2 ring-orange-500' : ''}`}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg">{item.itemName || '품목명 없음'}</p>
                      <p className="text-xs text-gray-400">병원 입력: {item.requestedQuantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Label className="text-[10px] text-gray-500 uppercase block mb-1">실제 수량</Label>
                        <Input 
                          type="number" 
                          value={item.driverQty}
                          onChange={(e) => updateQty(item.id, e.target.value)}
                          className="w-20 bg-gray-900 border-none text-right font-bold text-lg focus:ring-secondary text-white" 
                        />
                      </div>
                    </div>
                  </div>
                  {diff !== 0 && (
                    <div className="flex items-center justify-between bg-orange-500/10 p-2 rounded-xl">
                      <div className="flex items-center gap-2 text-orange-500 text-sm font-bold">
                        <AlertCircle className="h-4 w-4" />
                        차이 발생
                      </div>
                      <div className="text-orange-500 font-bold">
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
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-bold text-orange-500 uppercase px-1">차이 사유 및 증빙 (필수)</h3>
            <Card className="bg-gray-800 border-orange-500/50 rounded-2xl">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">차이 발생 사유</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="bg-gray-900 border-none h-12 text-white">
                      <SelectValue placeholder="사유를 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      <SelectItem value="loss">세탁물 분실 의심</SelectItem>
                      <SelectItem value="error">병원 측 입력 오류</SelectItem>
                      <SelectItem value="damage">오염/파손으로 인한 제외</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-square bg-gray-900 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-700 text-gray-500">
                    <Camera className="h-6 w-6" />
                    <span className="text-[10px] mt-1 font-bold">사진 첨부</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="bg-gray-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-secondary" />
            <p className="text-sm font-bold">병원 담당자 확인</p>
          </div>
          <p className="text-xs text-gray-400">현장에서 병원 담당자에게 실제 수량을 확인받았음을 서약합니다.</p>
          <Button variant="outline" className="w-full border-gray-700 bg-transparent text-gray-300">
            담당자 서명 / 확인 (선택)
          </Button>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/80 backdrop-blur-md border-t border-white/10 flex gap-3 z-30 max-w-lg mx-auto">
        <Button 
          className="w-full h-14 rounded-2xl font-bold gap-2 bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
          onClick={handleComplete}
          disabled={hasDiscrepancy && (!reason)}
        >
          수거 완료 처리
        </Button>
      </div>
    </div>
  );
}
