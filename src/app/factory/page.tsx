
"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LaundryStatus } from '../lib/types';
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { AlertCircle, Clock, Package, MoreVertical, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function FactoryKanban() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const columns: { title: string; status: LaundryStatus; color: string }[] = [
    { title: '입고완료', status: '공장입고', color: 'bg-purple-500' },
    { title: '세탁중', status: '세탁중', color: 'bg-blue-500' },
    { title: '건조중', status: '건조중', color: 'bg-orange-500' },
    { title: '포장완료', status: '포장완료', color: 'bg-indigo-500' },
    { title: '출고대기', status: '출고', color: 'bg-emerald-500' },
  ];

  const factoryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('currentStatus', 'in', columns.map(c => c.status))
    );
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(factoryQuery);

  const handleStatusChange = (requestId: string, nextStatus: LaundryStatus) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', requestId), {
      currentStatus: nextStatus,
      updatedAt: new Date().toISOString()
    });
    toast({
      title: "상태 변경 완료",
      description: `요청이 ${nextStatus} 단계로 이동되었습니다.`,
    });
  };

  if (isLoading) return <div className="p-8 text-center">공정 데이터를 불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">공정 칸반 보드</h1>
          <p className="text-muted-foreground">세탁물의 현재 공정 상태를 실시간으로 관리하세요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">공정 리포트</Button>
          <Button className="bg-purple-700">신규 입고 스캔</Button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[70vh]">
        {columns.map((col, idx) => (
          <div key={col.status} className="flex-shrink-0 w-80 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${col.color}`}></div>
                <h2 className="font-bold text-slate-700">{col.title}</h2>
                <Badge variant="secondary" className="rounded-full">
                  {requests?.filter(r => r.currentStatus === col.status).length || 0}
                </Badge>
              </div>
            </div>
            
            <div className="kanban-column bg-slate-100/50 p-2 rounded-xl min-h-[500px]">
              {requests?.filter(r => r.currentStatus === col.status).map((req) => (
                <Card key={req.id} className="rounded-xl border-none shadow-sm hover:shadow-md transition-shadow mb-3 bg-white">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm">{req.hospitalName}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{req.id.slice(-8)}</p>
                      </div>
                      {req.isContaminated && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[9px]">오염물</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 border border-slate-100">
                        <Package className="h-3 w-3" />
                        <span>요청 {req.requestDate.split('-').slice(1).join('/')}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground italic">
                        {new Date(req.updatedAt || req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 업데이트
                      </span>
                      {idx < columns.length - 1 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-[10px] font-bold text-primary gap-1 px-2 bg-primary/5 hover:bg-primary/10"
                          onClick={() => handleStatusChange(req.id, columns[idx + 1].status)}
                        >
                          다음 단계 <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!requests?.some(r => r.currentStatus === col.status) && (
                <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                  항목 없음
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
