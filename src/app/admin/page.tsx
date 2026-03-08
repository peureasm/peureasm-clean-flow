
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import { Package, Truck, AlertTriangle, CheckCircle, ArrowRight, Sparkles, BrainCircuit, RefreshCw, Hospital } from 'lucide-react';
import { aiDiscrepancyResolutionAssistant, AiDiscrepancyResolutionAssistantOutput } from '@/ai/flows/ai-discrepancy-resolution-assistant-flow';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import Link from 'next/link';

export default function AdminDashboard() {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<AiDiscrepancyResolutionAssistantOutput | null>(null);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // 실시간 데이터 구독
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'collectionRequests'), limit(50));
  }, [firestore, user]);

  const hospitalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'hospitals'), limit(100));
  }, [firestore, user]);

  const { data: requests, isLoading: isReqLoading } = useCollection(requestsQuery);
  const { data: hospitals, isLoading: isHospLoading } = useCollection(hospitalsQuery);

  // KPI 계산 (실제 데이터 기반)
  const activeRequests = requests?.filter(r => !['종결', '병원확인완료'].includes(r.currentStatus)).length || 0;
  const deliveryCompleted = requests?.filter(r => r.currentStatus === '납품완료').length || 0;
  const discrepancies = requests?.filter(r => r.discrepancyReason).length || 0;
  const totalHospitals = hospitals?.length || 0;

  const kpis = [
    { label: '활성 공정', value: `${activeRequests}건`, icon: Package, color: 'text-primary' },
    { label: '납품 완료', value: `${deliveryCompleted}건`, icon: Truck, color: 'text-secondary' },
    { label: '이슈 발생', value: `${discrepancies}건`, icon: AlertTriangle, color: 'text-orange-500' },
    { label: '등록 병원', value: `${totalHospitals}개`, icon: Hospital, color: 'text-emerald-500' },
  ];

  const handleResolveAI = async (req: any) => {
    setIsResolving(true);
    try {
      const res = await aiDiscrepancyResolutionAssistant({
        discrepancyId: req.id,
        hospitalName: req.hospitalName,
        requestDetails: "수거 물량 불일치 분석 요청",
        actualDetails: `기사 확인 사유: ${req.discrepancyReason || "미입력"}`,
        discrepancyReason: req.discrepancyReason || "사유 미입력",
      });
      setResolutionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">통합 관제 센터</h1>
          <p className="text-muted-foreground">실시간 세탁 공정 모니터링 및 AI 데이터 통합 분석</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200" asChild>
            <Link href="/admin/stats">상세 통계</Link>
          </Button>
          <Button className="bg-primary rounded-xl px-6" asChild>
            <Link href="/admin/hospitals">병원 관리</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-50 ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-black">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
            <CardTitle className="text-lg font-bold">최근 공정 타임라인</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary font-bold" asChild>
              <Link href="/admin/requests">전체보기</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isReqLoading ? (
              <div className="p-12 text-center text-slate-300 italic">실시간 데이터 로딩 중...</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold">병원명</TableHead>
                    <TableHead className="font-bold">요청일</TableHead>
                    <TableHead className="font-bold">상태</TableHead>
                    <TableHead className="text-right font-bold">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map((req) => (
                    <TableRow key={req.id} className="hover:bg-slate-50/30 transition-colors">
                      <TableCell className="font-bold text-slate-800">{req.hospitalName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{req.requestDate}</TableCell>
                      <TableCell><StatusBadge status={req.currentStatus as any} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                          <Link href={`/admin/requests/${req.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-400">등록된 공정 데이터가 없습니다.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white rounded-2xl border-l-4 border-l-orange-500 overflow-hidden">
            <CardHeader className="bg-orange-50/50 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg font-bold text-slate-800">이슈 모니터링</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {requests?.filter(r => r.discrepancyReason).length ? (
                <div className="divide-y divide-slate-100">
                  {requests?.filter(r => r.discrepancyReason).slice(0, 3).map((req) => (
                    <div key={req.id} className="p-4 space-y-3 hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-slate-800">{req.hospitalName}</p>
                        <Badge className="text-[9px] bg-orange-500 text-white border-none font-bold">불일치</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground bg-slate-50 p-2 rounded-lg italic">"{req.discrepancyReason}"</p>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full h-8 text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg"
                        onClick={() => handleResolveAI(req)}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" /> AI 분석 실행
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-300 text-sm italic">현재 처리 중인 이슈가 없습니다.</div>
              )}
            </CardContent>
          </Card>

          {isResolving && (
            <div className="p-8 text-center bg-white rounded-2xl shadow-lg border-2 border-primary/20 animate-pulse">
              <BrainCircuit className="h-10 w-10 text-primary mx-auto mb-4 animate-bounce" />
              <p className="font-bold text-primary">AI 분석 엔진 가동 중...</p>
            </div>
          )}

          {resolutionResult && (
            <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-white/5 border-b border-white/10 flex flex-row items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <CardTitle className="text-sm">AI 분쟁 조율 가이드</CardTitle>
                <Badge className={`ml-auto border-none ${resolutionResult.riskLevel === 'high' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                   {resolutionResult.riskLevel.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-accent font-bold uppercase tracking-widest">권장 해결 방안</p>
                  <p className="text-sm leading-relaxed text-slate-200">{resolutionResult.suggestedResolution}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-accent font-bold uppercase tracking-widest">커뮤니케이션 템플릿</p>
                  <div className="bg-white/5 p-4 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed border border-white/5 text-slate-300">
                    {resolutionResult.communicationTemplate}
                  </div>
                </div>
                <Button className="w-full bg-accent text-slate-900 font-bold h-12 rounded-xl" onClick={() => setResolutionResult(null)}>
                  가이드 닫기
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
