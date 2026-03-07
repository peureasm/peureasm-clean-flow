
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Sparkles, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { aiDiscrepancyResolutionAssistant, AiDiscrepancyResolutionAssistantOutput } from '@/ai/flows/ai-discrepancy-resolution-assistant-flow';

export default function AdminDiscrepanciesPage() {
  const firestore = useFirestore();
  const [isResolving, setIsResolving] = useState<string | null>(null);
  const [resolutionResult, setResolutionResult] = useState<AiDiscrepancyResolutionAssistantOutput | null>(null);

  const discrepancyQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // discrepancyReason이 존재하는 것만 필터링 (간단하게 limit로 전체 가져와서 클라이언트에서 필터링하거나 보안규칙/색인에 맞춰 조정)
    return query(collection(firestore, 'collectionRequests'), limit(50));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(discrepancyQuery);
  const issues = requests?.filter(r => r.discrepancyReason) || [];

  const handleResolveAI = async (req: any) => {
    setIsResolving(req.id);
    try {
      const res = await aiDiscrepancyResolutionAssistant({
        discrepancyId: req.id,
        hospitalName: req.hospitalName,
        requestDetails: "수거 물량 불일치 분석 요청",
        actualDetails: `기사 확인 사유: ${req.discrepancyReason}`,
        discrepancyReason: req.discrepancyReason,
      });
      setResolutionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">차이 발생 모니터링</h1>
          <p className="text-muted-foreground">수량 불일치 및 공정 이슈가 발생한 건들을 관리하고 조율합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">활성 이슈 큐 ({issues.length})</h2>
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 italic">이슈 데이터 로딩 중...</div>
          ) : issues.length > 0 ? (
            issues.map((req) => (
              <Card key={req.id} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{req.hospitalName}</h3>
                      <p className="text-xs text-muted-foreground">ID: {req.id.slice(-12)} | 요청일: {req.requestDate}</p>
                    </div>
                    <Badge className="bg-orange-500 text-white border-none font-bold">수량 불일치</Badge>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">발생 사유</p>
                    <p className="text-sm italic text-slate-700">"{req.discrepancyReason}"</p>
                  </div>
                  <Button 
                    className="w-full rounded-xl bg-primary/10 text-primary hover:bg-primary/20 gap-2 font-bold"
                    onClick={() => handleResolveAI(req)}
                    disabled={!!isResolving}
                  >
                    <Sparkles className="h-4 w-4" /> {isResolving === req.id ? 'AI 분석 중...' : 'AI 분쟁 조율 가이드 생성'}
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center text-slate-300 italic rounded-2xl border-none shadow-sm bg-white">
              현재 처리할 이슈가 없습니다.
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">분석 결과 및 가이드</h2>
          {isResolving ? (
            <div className="p-12 text-center bg-white rounded-2xl shadow-sm border-2 border-primary/20 animate-pulse">
              <BrainCircuit className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce" />
              <p className="font-bold text-primary">AI 엔진이 로그와 데이터를 분석 중입니다...</p>
            </div>
          ) : resolutionResult ? (
            <Card className="border-none shadow-xl bg-slate-900 text-white rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <CardHeader className="bg-white/5 border-b border-white/10 flex flex-row items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <CardTitle className="text-sm">AI 추천 해결 프로세스</CardTitle>
                <Badge className={`ml-auto border-none ${resolutionResult.riskLevel === 'high' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                   {resolutionResult.riskLevel.toUpperCase()} RISK
                </Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] text-accent font-bold uppercase tracking-widest">권장 조치</p>
                  <p className="text-sm leading-relaxed text-slate-200">{resolutionResult.suggestedResolution}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-accent font-bold uppercase tracking-widest">병원 안내 메시지</p>
                  <div className="bg-white/5 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-white/5 text-slate-300">
                    {resolutionResult.communicationTemplate}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-white/10 text-white hover:bg-white/5 rounded-xl" onClick={() => setResolutionResult(null)}>무시</Button>
                  <Button className="flex-[2] bg-accent text-slate-900 font-bold rounded-xl">해결책 적용 및 전송</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-300">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">좌측 목록에서 이슈를 선택하여<br/>AI 분석을 시작하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
