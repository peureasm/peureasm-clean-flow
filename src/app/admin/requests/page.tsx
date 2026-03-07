
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowRight, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function AdminRequestsPage() {
  const firestore = useFirestore();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'collectionRequests'), limit(50));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(requestsQuery);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">전체 요청 내역</h1>
          <p className="text-muted-foreground">시스템에 등록된 모든 세탁 수거 및 납품 요청을 관리합니다.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">요청 목록</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 italic">데이터 로드 중...</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold">병원명</TableHead>
                  <TableHead className="font-bold">요청일</TableHead>
                  <TableHead className="font-bold">상태</TableHead>
                  <TableHead className="font-bold">최종 업데이트</TableHead>
                  <TableHead className="text-right font-bold">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests?.map((req) => (
                  <TableRow key={req.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="font-bold text-slate-800">{req.hospitalName}</TableCell>
                    <TableCell className="text-sm">{req.requestDate}</TableCell>
                    <TableCell><StatusBadge status={req.currentStatus as any} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.updatedAt || req.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/requests/${req.id}`}>
                          상세보기 <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && (!requests || requests.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-400">등록된 요청이 없습니다.</TableCell>
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
