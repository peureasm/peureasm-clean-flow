
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, ArrowRight, CheckCircle2, Loader2, Search, Calculator } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SettlementItem {
  requestId: string;
  hospitalName: string;
  requestDate: string;
  totalAmount: number;
  itemCount: number;
  status: string;
}

export default function AdminSettlementsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [settlementData, setSettlementData] = useState<SettlementItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 정산 대상 (병원확인완료 상태) 요청 쿼리
  const pendingQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('currentStatus', '==', '병원확인완료')
    );
  }, [firestore, user]);

  const { data: requests, isLoading: isRequestsLoading } = useCollection(pendingQuery);

  // 품목 마스터 (단가 참조용)
  const itemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'laundryItems');
  }, [firestore]);
  const { data: masterItems } = useCollection(itemsQuery);

  useEffect(() => {
    const calculateSettlements = async () => {
      if (!requests || !masterItems || !firestore) {
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      const results: SettlementItem[] = [];

      for (const req of requests) {
        // 각 요청의 상세 품목 가져오기
        const itemsSnap = await getDocs(collection(firestore, `collectionRequests/${req.id}/items`));
        let total = 0;
        let count = 0;

        itemsSnap.docs.forEach(doc => {
          const itemData = doc.data();
          const master = masterItems.find(m => m.id === itemData.laundryItemId);
          const price = master?.pricePerUnit || 0;
          const qty = itemData.deliveredQuantity || itemData.verifiedQuantity || itemData.requestedQuantity || 0;
          
          total += (price * qty);
          count += qty;
        });

        results.push({
          requestId: req.id,
          hospitalName: req.hospitalName,
          requestDate: req.requestDate,
          totalAmount: total,
          itemCount: count,
          status: req.currentStatus
        });
      }

      setSettlementData(results);
      setIsLoadingData(false);
    };

    calculateSettlements();
  }, [requests, masterItems, firestore]);

  const handleCompleteSettlement = (id: string) => {
    if (!firestore) return;
    setProcessingId(id);

    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', id), {
      currentStatus: '종결',
      settledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setTimeout(() => {
      toast({
        title: "정산 완료",
        description: "해당 요청이 종결 처리되었으며 정산이 완료되었습니다.",
      });
      setSettlementData(prev => prev.filter(item => item.requestId !== id));
      setProcessingId(null);
    }, 500);
  };

  const totalPendingAmount = settlementData.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" /> 정산 관리
          </h1>
          <p className="text-muted-foreground font-medium">병원 측 최종 확인이 완료된 건에 대해 대금을 정산하고 종결 처리합니다.</p>
        </div>
        <div className="bg-primary/5 px-6 py-4 rounded-3xl border border-primary/10">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">총 정산 대기 금액</p>
          <p className="text-2xl font-black text-slate-900">₩{totalPendingAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-slate-400" />
              정산 대기 목록 ({settlementData.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData || isRequestsLoading ? (
              <div className="p-20 text-center flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-bold text-slate-400">정산 데이터를 계산 중입니다...</p>
              </div>
            ) : settlementData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30">
                    <TableHead className="font-bold text-xs pl-8">병원 정보</TableHead>
                    <TableHead className="font-bold text-xs">납품 수량</TableHead>
                    <TableHead className="font-bold text-xs">최종 정산액</TableHead>
                    <TableHead className="text-right font-bold text-xs pr-8">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlementData.map((item) => (
                    <TableRow key={item.requestId} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-8 py-5">
                        <p className="font-black text-slate-800">{item.hospitalName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">확인일: {item.requestDate}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 font-bold border-slate-200">
                          {item.itemCount}개 품목
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-black text-primary">₩{item.totalAmount.toLocaleString()}</p>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild className="rounded-xl h-9 text-slate-400 hover:text-primary">
                            <Link href={`/admin/requests/${item.requestId}`}>내역확인</Link>
                          </Button>
                          <Button 
                            size="sm" 
                            className="rounded-xl h-9 bg-slate-900 text-white font-bold gap-1 shadow-md shadow-slate-200"
                            onClick={() => handleCompleteSettlement(item.requestId)}
                            disabled={processingId === item.requestId}
                          >
                            {processingId === item.requestId ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            정산완료
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-24 text-center space-y-4">
                <CreditCard className="h-12 w-12 text-slate-200 mx-auto" />
                <p className="text-slate-400 font-bold">현재 정산 대기 중인 건이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10">
              <CardTitle className="text-sm font-bold">정산 요약 가이드</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">정산 대상 총 건수</span>
                  <span className="font-bold">{settlementData.length}건</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">평균 건당 정산액</span>
                  <span className="font-bold">
                    ₩{settlementData.length > 0 ? Math.round(totalPendingAmount / settlementData.length).toLocaleString() : 0}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex gap-3">
                  <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    병원 담당자가 '납품 확인'을 마친 건들만 이 목록에 노출됩니다.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                    <DollarSign className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    정산 완료 버튼을 누르면 해당 요청이 '종결' 상태로 변경되며 이력이 보존됩니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
