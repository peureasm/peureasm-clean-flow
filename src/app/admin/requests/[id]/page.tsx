
"use client"

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Clock, Package, AlertCircle, History, TrendingDown, ClipboardList, MapPin, User, Sparkles, Hospital, FileSpreadsheet, MessageSquare, CheckCircle2, CreditCard, DollarSign } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import { useDoc, useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { aiDiscrepancyResolutionAssistant, AiDiscrepancyResolutionAssistantOutput } from '@/ai/flows/ai-discrepancy-resolution-assistant-flow';
import * as XLSX from 'xlsx';

export default function AdminRequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<AiDiscrepancyResolutionAssistantOutput | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'collectionRequests', id as string);
  }, [firestore, id]);

  const itemsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return collection(firestore, `collectionRequests/${id}/items`);
  }, [firestore, id]);

  const masterItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'laundryItems');
  }, [firestore]);

  const { data: request, isLoading: isReqLoading } = useDoc(requestRef);
  const { data: items, isLoading: isItemsLoading } = useCollection(itemsQuery);
  const { data: masterItems } = useCollection(masterItemsQuery);

  useEffect(() => {
    if (items && masterItems) {
      const total = items.reduce((acc, item) => {
        const master = masterItems.find(m => m.id === item.laundryItemId);
        const price = master?.pricePerUnit || 0;
        const qty = item.deliveredQuantity || item.verifiedQuantity || item.requestedQuantity || 0;
        return acc + (price * qty);
      }, 0);
      setTotalAmount(total);
    }
  }, [items, masterItems]);

  const handleResolveAI = async () => {
    if (!request) return;
    setIsResolving(true);
    try {
      const res = await aiDiscrepancyResolutionAssistant({
        discrepancyId: request.id,
        hospitalName: request.hospitalName,
        requestDetails: "관리자 상세 페이지 분석 요청",
        actualDetails: `기사 사유: ${request.discrepancyReason || "미입력"}`,
        discrepancyReason: request.discrepancyReason || "사유 미입력",
      });
      setResolutionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolving(false);
    }
  };

  const handleSettle = () => {
    if (!firestore || !id) return;
    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', id as string), {
      currentStatus: '종결',
      settledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    toast({
      title: "정산 및 종결 완료",
      description: "해당 요청의 정산 처리가 완료되어 종결 상태로 변경되었습니다.",
    });
  };

  const handleExportExcel = () => {
    if (!request || !items || items.length === 0) {
      toast({
        variant: "destructive",
        title: "다운로드 불가",
        description: "내보낼 품목 데이터가 없습니다.",
      });
      return;
    }

    try {
      const excelData = items.map(item => {
        const master = masterItems?.find(m => m.id === item.laundryItemId);
        const price = master?.pricePerUnit || 0;
        const qty = item.deliveredQuantity || item.verifiedQuantity || item.requestedQuantity || 0;
        return {
          "품목명": item.itemName,
          "단가": price,
          "최종 수량": qty,
          "소계": price * qty,
          "병원 요청": item.requestedQuantity || 0,
          "기사 확인": item.verifiedQuantity ?? "-",
          "공장 입고": item.inboundQuantity ?? "-",
          "최종 납품": item.deliveredQuantity ?? "-"
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "정산상세");

      const fileName = `MediLaundry_정산내역_${request.hospitalName}_${request.requestDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "엑셀 다운로드 완료",
        description: `${fileName} 파일이 생성되었습니다.`,
      });
    } catch (error) {
      console.error("Excel export error:", error);
    }
  };

  if (isReqLoading || isItemsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm font-bold text-muted-foreground">세탁물 상세 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!request) return <div className="p-20 text-center font-bold">요청 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">요청 상세 관리</h1>
            <p className="text-sm text-muted-foreground">ID: {request.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
           {request.currentStatus === '병원확인완료' && (
             <Button onClick={handleSettle} className="rounded-xl bg-slate-900 text-white gap-2 h-10 px-6 font-bold shadow-lg shadow-slate-200">
               <CreditCard className="h-4 w-4" /> 정산 및 종결 처리
             </Button>
           )}
           <Button 
             onClick={handleExportExcel} 
             className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 px-4 shadow-md shadow-emerald-500/20 font-bold border-none"
           >
             <FileSpreadsheet className="h-4 w-4" /> 엑셀 다운로드
           </Button>
           <Button className="rounded-xl bg-orange-500 hover:bg-orange-600 gap-2 h-10 text-xs font-bold shadow-md shadow-orange-500/20" onClick={handleResolveAI} disabled={isResolving}>
             <Sparkles className="h-4 w-4" /> {isResolving ? 'AI 분석 중...' : 'AI 분석'}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold">공정 및 정산 현황</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/5 text-primary border-none font-bold">합계: ₩{totalAmount.toLocaleString()}</Badge>
                  <StatusBadge status={request.currentStatus as any} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">병원명</p>
                    <p className="font-bold flex items-center gap-2"><Hospital className="h-4 w-4 text-primary" /> {request.hospitalName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">요청일</p>
                    <p className="font-bold">{request.requestDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">정산 시각</p>
                    <p className="text-sm">{request.settledAt ? new Date(request.settledAt).toLocaleString() : '미완료'}</p>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b pb-4">
               <CardTitle className="text-lg font-bold">품목별 정산 상세</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-bold pl-8">품목명</TableHead>
                      <TableHead className="text-center font-bold">단가</TableHead>
                      <TableHead className="text-center font-bold">최종 수량</TableHead>
                      <TableHead className="text-right font-bold pr-8">소계</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                   {items?.map((item) => {
                     const master = masterItems?.find(m => m.id === item.laundryItemId);
                     const price = master?.pricePerUnit || 0;
                     const qty = item.deliveredQuantity || item.verifiedQuantity || item.requestedQuantity || 0;
                     return (
                       <TableRow key={item.id}>
                         <TableCell className="font-bold pl-8">{item.itemName}</TableCell>
                         <TableCell className="text-center text-slate-500 font-medium">₩{price.toLocaleString()}</TableCell>
                         <TableCell className="text-center font-black">{qty}</TableCell>
                         <TableCell className="text-right pr-8 font-black text-primary">₩{(price * qty).toLocaleString()}</TableCell>
                       </TableRow>
                     );
                   })}
                   <TableRow className="bg-primary/5 hover:bg-primary/5 border-t-2 border-primary/10">
                     <TableCell colSpan={3} className="pl-8 py-6 font-black text-slate-900">최종 정산 합계</TableCell>
                     <TableCell className="text-right pr-8 py-6 font-black text-2xl text-primary">₩{totalAmount.toLocaleString()}</TableCell>
                   </TableRow>
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-400" />
                정산 정보 가이드
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               <p className="text-xs text-slate-500 leading-relaxed">
                 정산 금액은 <span className="font-bold text-slate-900">최종 납품 수량(Delivered Qty)</span>을 기준으로 자동 계산됩니다. 납품이 완료되기 전에는 기사 확인 수량을 바탕으로 가계산됩니다.
               </p>
               <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                 <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
                 <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                   병원 담당자가 최종 승인을 마쳐야만 '정산 대기' 상태로 전환되어 관리자가 종결 처리할 수 있습니다.
                 </p>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-sm font-bold">공정 타임라인</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
               <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-primary border-2 border-white"></div>
                    <div>
                      <p className="text-xs font-bold">{request.currentStatus}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(request.updatedAt || request.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {request.finalConfirmedAt && (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                      <div>
                        <p className="text-xs font-bold text-emerald-600">병원 담당자 최종 승인</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(request.finalConfirmedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
