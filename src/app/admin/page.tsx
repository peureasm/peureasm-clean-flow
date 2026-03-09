"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import { Package, Truck, AlertTriangle, ArrowRight, RefreshCw, Hospital } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import Link from 'next/link';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user } = useUser();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'collectionRequests'), limit(50));
  }, [firestore, user]);

  const hospitalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'hospitals'), limit(100));
  }, [firestore, user]);

  const { data: requests, isLoading: isReqLoading } = useCollection(requestsQuery);
  const { data: hospitals } = useCollection(hospitalsQuery);

  const activeRequests = requests?.filter(r => !['종결', '병원확인완료'].includes(r.currentStatus)).length || 0;
  const deliveryCompleted = requests?.filter(r => r.currentStatus === '납품완료').length || 0;
  const discrepancies = requests?.filter(r => r.discrepancyReason).length || 0;
  const totalHospitals = hospitals?.length || 0;

  const kpis = [
    { label: '활성 공정', value: `${activeRequests}`, unit: '건', icon: Package, color: 'text-primary', bg: 'bg-primary/5' },
    { label: '납품 완료', value: `${deliveryCompleted}`, unit: '건', icon: Truck, color: 'text-secondary', bg: 'bg-accent' },
    { label: '이슈 발생', value: `${discrepancies}`, unit: '건', icon: AlertTriangle, color: 'text-chart-3', bg: 'bg-chart-3/5' },
    { label: '등록 병원', value: `${totalHospitals}`, unit: '개', icon: Hospital, color: 'text-primary', bg: 'bg-primary/5' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">종합 대시보드</h1>
          <p className="text-muted-foreground font-medium mt-1">실시간 데이터 및 공정 현황을 모니터링합니다.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="px-6 rounded-btn" asChild>
            <Link href="/admin/stats">통계 분석</Link>
          </Button>
          <Button className="px-8 rounded-btn soft-shadow bg-primary text-white" asChild>
            <Link href="/admin/hospitals">병원 관리</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-none hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-btn ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
                  <p className="text-3xl font-black mt-0.5 text-foreground">
                    {kpi.value}
                    <span className="text-sm font-bold text-muted-foreground ml-1">{kpi.unit}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border border-border overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-8 py-5">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              실시간 공정 흐름
            </CardTitle>
            <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-accent rounded-full px-4" asChild>
              <Link href="/admin/requests">전체보기 <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isReqLoading ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">데이터 동기화 중...</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b-border/50">
                    <TableHead className="pl-8 font-bold text-muted-foreground uppercase text-[11px] tracking-wider h-12">병원 정보</TableHead>
                    <TableHead className="font-bold text-muted-foreground uppercase text-[11px] tracking-wider h-12">요청일</TableHead>
                    <TableHead className="font-bold text-muted-foreground uppercase text-[11px] tracking-wider h-12">진행 상태</TableHead>
                    <TableHead className="text-right pr-8 font-bold text-muted-foreground uppercase text-[11px] tracking-wider h-12">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests && requests.length > 0 ? (
                    requests.map((req) => (
                      <TableRow key={req.id} className="table-row-hover transition-colors border-b-border/30">
                        <TableCell className="pl-8 py-5">
                          <p className="font-black text-foreground">{req.hospitalName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase">ID: {req.id.slice(-8)}</p>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-muted-foreground">{req.requestDate}</TableCell>
                        <TableCell><StatusBadge status={req.currentStatus as any} /></TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" asChild>
                            <Link href={`/admin/requests/${req.id}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-medium">현재 진행 중인 공정이 없습니다.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none border-l-4 border-l-chart-3">
            <CardHeader className="bg-chart-3/5 pb-4 px-6 pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-chart-3" />
                <CardTitle className="text-lg font-black text-foreground">이슈 모니터링</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              {requests?.filter(r => r.discrepancyReason).length ? (
                <div className="divide-y divide-border/50">
                  {requests?.filter(r => r.discrepancyReason).slice(0, 3).map((req) => (
                    <div key={req.id} className="p-6 space-y-4 table-row-hover transition-colors">
                      <div className="flex justify-between items-start">
                        <p className="font-black text-sm text-foreground">{req.hospitalName}</p>
                        <Badge className="bg-chart-3 text-white border-none font-bold text-[10px] px-2 py-0.5 rounded-full">불일치</Badge>
                      </div>
                      <div className="bg-muted p-4 rounded-btn border border-border italic">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">"{req.discrepancyReason}"</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full text-[11px] font-black h-10 border-chart-3/30 text-chart-3 hover:bg-chart-3 hover:text-white rounded-btn transition-all" asChild>
                        <Link href="/admin/discrepancies">AI 분석 가이드 실행</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center text-muted-foreground text-sm font-medium italic">이슈가 없습니다.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
