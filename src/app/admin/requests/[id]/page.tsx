"use client"

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Clock, Package, AlertCircle, History, TrendingDown, ClipboardList, MapPin, User, Sparkles, Hospital, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import { useDoc, useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { LAUNDRY_ITEMS } from '@/app/lib/data';
import { useState } from 'react';
import { aiDiscrepancyResolutionAssistant, AiDiscrepancyResolutionAssistantOutput } from '@/ai/flows/ai-discrepancy-resolution-assistant-flow';
import * as XLSX from 'xlsx';

export default function AdminRequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<AiDiscrepancyResolutionAssistantOutput | null>(null);

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
      // 엑셀 데이터 가공
      const excelData = items.map(item => ({
        "품목명": item.itemName,
        "병원 요청 수량": item.requestedQuantity || 0,
        "기사 확인 수량": item.verifiedQuantity ?? "-",
        "최종 납품 수량": item.deliveredQuantity ?? "-",
        "수량 차이(병원-기사)": item.verifiedQuantity !== undefined ? (item.verifiedQuantity - item.requestedQuantity) : "-"
      }));

      // 워크북 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "품목상세");

      // 파일 다운로드
      const fileName = `MediLaundry_상세내역_${request.hospitalName}_${request.requestDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "엑셀 다운로드 완료",
        description: `${fileName} 파일이 생성되었습니다.`,
      });
    } catch (error) {
      console.error("Excel export error:", error);
      toast({
        variant: "destructive",
        title: "다운로드 오류",
        description: "엑셀 파일을 생성하는 중 오류가 발생했습니다.",
      });
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
    <div className="space-y-6 max-w-5xl mx-auto">
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
           <Button variant="outline" className="rounded-xl gap-2" onClick={handleExportExcel}>
             <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> 엑셀 다운로드
           </Button>
           <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>문서 출력</Button>
           <Button className="rounded-xl bg-orange-500 hover:bg-orange-600 gap-2" onClick={handleResolveAI} disabled={isResolving}>
             <Sparkles className="h-4 w-4" /> {isResolving ? 'AI 분석 중...' : 'AI 분석'}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold">공정 진행 상태</CardTitle>
                <StatusBadge status={request.currentStatus as any} />
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase">생성시각</p>
                    <p className="text-sm">{new Date(request.createdAt).toLocaleString()}</p>
                  </div>
               </div>
               
               {request.discrepancyReason && (
                 <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3">
                   <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                   <div>
                     <p className="text-sm font-bold text-orange-700">발생된 이슈 사유</p>
                     <p className="text-sm text-orange-600 italic">"{request.discrepancyReason}"</p>
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b pb-4">
               <CardTitle className="text-lg font-bold">품목별 수량 대조</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-bold">품목명</TableHead>
                      <TableHead className="text-center font-bold">병원 요청</TableHead>
                      <TableHead className="text-center font-bold text-primary">기사 확인</TableHead>
                      <TableHead className="text-center font-bold text-indigo-600">최종 납품</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                   {items?.map((item) => (
                     <TableRow key={item.id}>
                       <TableCell className="font-bold">{item.itemName}</TableCell>
                       <TableCell className="text-center">{item.requestedQuantity}</TableCell>
                       <TableCell className="text-center font-black text-primary bg-primary/5">{item.verifiedQuantity ?? '-'}</TableCell>
                       <TableCell className="text-center font-black text-indigo-600 bg-indigo-50">{item.deliveredQuantity ?? '-'}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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
                  <div className="relative opacity-50">
                    <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-slate-300 border-2 border-white"></div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">요청 제출됨</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          {resolutionResult && (
            <Card className="border-none shadow-xl bg-slate-900 text-white rounded-3xl overflow-hidden animate-in zoom-in-95">
              <CardHeader className="bg-white/5 border-b border-white/10 flex flex-row items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <CardTitle className="text-xs">AI 추천 해결 방안</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                 <div className="space-y-1">
                   <p className="text-[10px] text-accent font-bold uppercase">권장 조치</p>
                   <p className="text-xs leading-relaxed text-slate-200">{resolutionResult.suggestedResolution}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] text-accent font-bold uppercase">커뮤니케이션 가이드</p>
                   <div className="bg-white/5 p-3 rounded-xl text-[10px] font-mono whitespace-pre-wrap text-slate-300 border border-white/5 leading-relaxed">
                     {resolutionResult.communicationTemplate}
                   </div>
                 </div>
                 <Button className="w-full h-10 bg-accent text-slate-900 font-bold rounded-xl text-xs" onClick={() => setResolutionResult(null)}>
                   분석 결과 닫기
                 </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
