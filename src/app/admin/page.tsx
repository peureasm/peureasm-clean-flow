
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import { Package, Truck, AlertTriangle, CheckCircle, ArrowRight, Sparkles, BrainCircuit, History } from 'lucide-react';
import { aiDiscrepancyResolutionAssistant, AiDiscrepancyResolutionAssistantOutput } from '@/ai/flows/ai-discrepancy-resolution-assistant-flow';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function AdminDashboard() {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<AiDiscrepancyResolutionAssistantOutput | null>(null);
  const firestore = useFirestore();

  const allRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'collectionRequests'), orderBy('createdAt', 'desc'), limit(10));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(allRequestsQuery);

  const kpis = [
    { label: '활성 요청', value: requests?.filter(r => r.currentStatus !== '종결').length || 0, icon: Package, color: 'text-primary' },
    { label: '납품 완료 (오늘)', value: requests?.filter(r => r.currentStatus === '납품완료').length || 0, icon: Truck, color: 'text-secondary' },
    { label: '차이 발생 건', value: requests?.filter(r => r.discrepancyReason).length || 0, icon: AlertTriangle, color: 'text-orange-500' },
    { label: '정산 대기', value: '₩1.4M', icon: CheckCircle, color: 'text-emerald-500' },
  ];

  const handleResolveAI = async (req: any) => {
    setIsResolving(true);
    try {
      // AI 기능은 실제 Flow 호출 대신 시뮬레이션으로 작동하도록 구성됨 (사용자 요청에 따라)
      const res = await aiDiscrepancyResolutionAssistant({
        discrepancyId: req.id,
        hospitalName: req.hospitalName,
        requestDetails: "수거 요청 물량과 실제 수거량의 차이가 발생함",
        actualDetails: `사유: ${req.discrepancyReason || "미입력"}`,
        discrepancyReason: req.discrepancyReason || "사유 미입력",
      });
      setResolutionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolving(false);
    }
  };

  const discrepancyRequests = requests?.filter(r => r.discrepancyReason);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">통합 관제 센터</h1>
          <p className="text-muted-foreground">병원-기사-공장 전 공정 실시간 모니터링</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl">시스템 로그</Button>
          <Button className="bg-primary rounded-xl">월간 리포트 생성</Button>
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
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
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
            <CardTitle className="text-lg">실시간 요청 타임라인</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary font-bold">전체보기</Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">데이터 로딩 중...</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold">병원명</TableHead>
                    <TableHead className="font-bold">최종 업데이트</TableHead>
                    <TableHead className="font-bold">상태</TableHead>
                    <TableHead className="text-right font-bold">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map((req) => (
                    <TableRow key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold">{req.hospitalName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(req.updatedAt || req.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell><StatusBadge status={req.currentStatus as any} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                <CardTitle className="text-lg font-bold">차이 발생 모니터링</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-auto">
              {discrepancyRequests && discrepancyRequests.length > 0 ? (
                <div className="divide-y">
                  {discrepancyRequests.map((req) => (
                    <div key={req.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm">{req.hospitalName}</p>
                        <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-600 font-bold bg-orange-50">Δ 수량차이</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{req.discrepancyReason}"
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground font-mono">{req.id.slice(-6)}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-[11px] font-bold text-primary gap-1 px-2"
                          onClick={() => handleResolveAI(req)}
                        >
                          <Sparkles className="h-3 w-3" /> AI 분석
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm italic">현재 처리할 이슈가 없습니다.</div>
              )}
            </CardContent>
          </Card>

          {isResolving && (
            <div className="p-8 text-center bg-white rounded-2xl shadow-lg border-2 border-primary/20 animate-pulse">
              <BrainCircuit className="h-10 w-10 text-primary mx-auto mb-4 animate-bounce" />
              <p className="font-bold text-primary">AI가 분쟁 해결 가이드를 생성 중입니다...</p>
            </div>
          )}

          {resolutionResult && (
            <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              <CardHeader className="bg-white/5 border-b border-white/10 flex flex-row items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <CardTitle className="text-sm">AI 해결 권고안</CardTitle>
                <Badge className={`ml-auto border-none ${resolutionResult.riskLevel === 'high' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                  위험도: {resolutionResult.riskLevel}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-accent font-bold uppercase tracking-widest">권장 해결 방안</p>
                  <p className="text-sm leading-relaxed text-slate-200">{resolutionResult.suggestedResolution}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-accent font-bold uppercase tracking-widest">소통 템플릿</p>
                  <div className="bg-white/5 p-3 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed border border-white/5">
                    {resolutionResult.communicationTemplate}
                  </div>
                </div>
                <Button className="w-full bg-accent text-slate-900 font-bold h-11 rounded-xl hover:bg-accent/90" onClick={() => setResolutionResult(null)}>
                  조치 완료 처리
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
