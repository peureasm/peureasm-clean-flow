
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ClipboardList, Download, FileSpreadsheet, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

export default function AdminRequestsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // 최신순으로 정렬하려면 createdAt 필드에 색인이 필요할 수 있습니다.
    // 여기서는 단순 쿼리를 사용합니다.
    return query(collection(firestore, 'collectionRequests'), limit(100));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(requestsQuery);

  const filteredRequests = requests?.filter(req => {
    const matchSearch = req.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = filterDate ? req.requestDate === filterDate : true;
    return matchSearch && matchDate;
  }) || [];

  const handleExportExcel = () => {
    if (filteredRequests.length === 0) {
      toast({
        variant: "destructive",
        title: "다운로드 불가",
        description: "내보낼 데이터가 없습니다.",
      });
      return;
    }

    try {
      // 엑셀에 들어갈 데이터 가공
      const excelData = filteredRequests.map(req => ({
        "요청 ID": req.id,
        "병원명": req.hospitalName,
        "수거요청일": req.requestDate,
        "현재상태": req.currentStatus,
        "오염물여부": req.isContaminated ? "예" : "아니오",
        "특이사항": req.specialNotes || "-",
        "최종업데이트": new Date(req.updatedAt || req.createdAt).toLocaleString(),
      }));

      // 워크북 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "수거내역");

      // 파일 다운로드
      const fileName = filterDate 
        ? `MediLaundry_수거내역_${filterDate}.xlsx` 
        : `MediLaundry_전체수거내역_${new Date().toISOString().split('T')[0]}.xlsx`;
      
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">전체 요청 내역</h1>
          <p className="text-muted-foreground font-medium">시스템에 등록된 모든 세탁 수거 및 납품 요청을 관리하고 분석합니다.</p>
        </div>
        <Button 
          onClick={handleExportExcel} 
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 px-6 shadow-lg shadow-emerald-500/20"
        >
          <FileSpreadsheet className="h-5 w-5" /> 엑셀 다운로드
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader className="border-b px-6 py-4 bg-slate-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold">요청 목록</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="병원명 검색..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-xl border-slate-200 h-10 w-[200px]"
                />
              </div>
              <Input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="rounded-xl border-slate-200 h-10 w-[160px]"
              />
              {(searchTerm || filterDate) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {setSearchTerm(""); setFilterDate("");}}
                  className="text-xs text-slate-500"
                >
                  필터 초기화
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-20 text-center text-slate-400 italic flex flex-col items-center gap-2">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              데이터 로드 중...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">병원명</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">수거요청일</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">상태</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">최종 업데이트</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">상세보기</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="font-bold text-slate-800">{req.hospitalName}</TableCell>
                    <TableCell className="text-sm font-medium">{req.requestDate}</TableCell>
                    <TableCell><StatusBadge status={req.currentStatus as any} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.updatedAt || req.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="rounded-full h-8 w-8">
                        <Link href={`/admin/requests/${req.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                      조건에 맞는 요청 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
