
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import { Package, Truck, AlertTriangle, CheckCircle, ArrowRight, Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';
import { aiDiscrepancyResolutionAssistant, AiDiscrepancyResolutionAssistantOutput } from '@/ai/flows/ai-discrepancy-resolution-assistant-flow';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';

export default function AdminDashboard() {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<AiDiscrepancyResolutionAssistantOutput | null>(null);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // 인덱스 오류를 피하기 위해 단순 쿼리 사용
  const allRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'collectionRequests'), limit(20));
  }, [firestore, user]);

  const { data: requests, isLoading, error } = useCollection(allRequestsQuery);

  const kpis = [
    { label: '활성 요청', value: requests?.filter(r => !['종결', '병원확인완료'].includes(r.currentStatus)).length || 0, icon: Package, color: 'text-primary' },
    { label: '납품 완료', value: requests?.filter(r => r.currentStatus === '납품완료').length || 0, icon: Truck, color: 'text-secondary' },
    { label: '차이 발생', value: requests?.filter(r => r.discrepancyReason).length || 0, icon: AlertTriangle, color: 'text-orange-500' },
    { label: '최근 정산건', value: '0건', icon: CheckCircle, color: 'text-emerald-500' },
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

  if (isUserLoading) return <div className="p-12 text-center text-muted-foreground font-bold">인증 대기 중...</div>;

  if (error) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl shadow-sm border border-red-100">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">데이터를 불러올 수 없습니다</h3>
          <p className="text-sm text-muted-foreground mt-1">Firebase Console에서 Firestore가 활성화되어 있는지 확인해 주세요.</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl gap-2">
          <RefreshCw className="h-4 w-4" /> 다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">통합 관제 센터</h1>
          <p className="text-muted-foreground">실시간 세탁 공정 모니터링 및 AI 분쟁 조율</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200">시스템 로그</Button>
          <Button className="bg-primary rounded-xl px-6">월간 정산 보고서</Button>
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
            <CardTitle className="text-lg font-bold">전체 요청 타임라인</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary font-bold">전체보기</Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-slate-300 italic">데이터 로딩 중...</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold">병원명</TableHead>
                    <TableHead className="font-bold">날짜</TableHead>
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
                <CardTitle className="text-lg font-bold text-slate-800">이슈 모니터링</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {requests?.filter(r => r.discrepancyReason).length ? (
                <div className="divide-y divide-slate-100">
                  {requests?.filter(r => r.discrepancyReason).map((req) => (
                    <div key={req.id} className="p-4 space-y-3 hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-slate-800">{req.hospitalName}</p>
                        <Badge className="text-[9px] bg-orange-500 text-white border-none font-bold">Δ 불일치</Badge>
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
                  조치 완료 및 닫기
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
