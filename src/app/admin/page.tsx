
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DUMMY_REQUESTS } from '../lib/data';
import StatusBadge from '@/components/shared/StatusBadge';
import { Package, Truck, AlertTriangle, CheckCircle, ArrowRight, Sparkles, BrainCircuit } from 'lucide-react';
import { aiDiscrepancyResolutionAssistant, AiDiscrepancyResolutionAssistantOutput } from '@/ai/flows/ai-discrepancy-resolution-assistant-flow';

export default function AdminDashboard() {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<AiDiscrepancyResolutionAssistantOutput | null>(null);

  const kpis = [
    { label: '오늘 수거 요청', value: '14건', icon: Package, color: 'text-primary' },
    { label: '오늘 납품 완료', value: '8건', icon: Truck, color: 'text-secondary' },
    { label: '차이 발생 건', value: '3건', icon: AlertTriangle, color: 'text-orange-500' },
    { label: '정산 대기', value: '₩1.2M', icon: CheckCircle, color: 'text-emerald-500' },
  ];

  const handleResolveAI = async (req: any) => {
    setIsResolving(true);
    try {
      const res = await aiDiscrepancyResolutionAssistant({
        discrepancyId: req.id,
        hospitalName: req.hospitalName,
        requestDetails: req.items.map((i: any) => `${i.itemName} ${i.hospitalQty}개`).join(', '),
        actualDetails: req.items.map((i: any) => `${i.itemName} ${i.driverQty || 0}개`).join(', '),
        discrepancyReason: req.discrepancyReason || "사유 미입력",
      });
      setResolutionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolving(false);
    }
  };

  const discrepancyRequests = DUMMY_REQUESTS.filter(r => 
    r.items.some(i => i.driverQty !== undefined && i.driverQty !== i.hospitalQty)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">통합 관제 대시보드</h1>
          <p className="text-muted-foreground">실시간 수거/납품 현황 및 물량 차이 분석</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">보고서 다운로드</Button>
          <Button className="bg-primary">실시간 모니터링</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-50 ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>최근 요청 현황</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary font-bold">전체보기</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">요청ID</TableHead>
                  <TableHead className="font-bold">병원명</TableHead>
                  <TableHead className="font-bold">수거일시</TableHead>
                  <TableHead className="font-bold">상태</TableHead>
                  <TableHead className="text-right font-bold">조치</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DUMMY_REQUESTS.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs">{req.id}</TableCell>
                    <TableCell className="font-bold">{req.hospitalName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{req.requestDate} {req.preferredTime}</TableCell>
                    <TableCell><StatusBadge status={req.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white rounded-2xl border-l-4 border-l-orange-500 overflow-hidden">
            <CardHeader className="bg-orange-50 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">차이 발생 큐 (Δ)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {discrepancyRequests.map((req) => (
                  <div key={req.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm">{req.hospitalName}</p>
                      <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-600">수량 불일치</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{req.discrepancyReason}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        {req.items.map((i: any) => (
                          <span key={i.itemId} className="text-[10px] bg-slate-100 px-1 rounded">-{i.hospitalQty - (i.driverQty || 0)} {i.itemName}</span>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-[11px] font-bold text-primary gap-1"
                        onClick={() => handleResolveAI(req)}
                      >
                        <Sparkles className="h-3 w-3" /> AI 분석
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
              <CardHeader className="bg-primary/20 border-b border-white/10 flex flex-row items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <CardTitle className="text-sm">AI 해결 권고안</CardTitle>
                <Badge className={`ml-auto ${resolutionResult.riskLevel === 'high' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                  위험도: {resolutionResult.riskLevel}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-accent font-bold uppercase">권장 해결 방안</p>
                  <p className="text-sm leading-relaxed">{resolutionResult.suggestedResolution}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-accent font-bold uppercase">소통 템플릿</p>
                  <div className="bg-white/5 p-3 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
                    {resolutionResult.communicationTemplate}
                  </div>
                </div>
                <Button className="w-full bg-accent text-slate-900 font-bold h-10 rounded-xl" onClick={() => setResolutionResult(null)}>
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
