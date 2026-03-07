
"use client"

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LaundryStatus } from '../lib/types';
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Package, ArrowRight, Kanban, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function FactoryKanban() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const columns: { title: string; status: LaundryStatus; color: string }[] = [
    { title: '입고완료', status: '공장입고', color: 'bg-purple-500' },
    { title: '세탁중', status: '세탁중', color: 'bg-blue-500' },
    { title: '건조중', status: '건조중', color: 'bg-orange-500' },
    { title: '포장완료', status: '포장완료', color: 'bg-indigo-500' },
    { title: '출고대기', status: '출고', color: 'bg-emerald-500' },
  ];

  const factoryQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('currentStatus', 'in', columns.map(c => c.status))
    );
  }, [firestore, user]);

  const { data: requests, isLoading } = useCollection(factoryQuery);

  const handleStatusChange = (requestId: string, nextStatus: LaundryStatus) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', requestId), {
      currentStatus: nextStatus,
      updatedAt: new Date().toISOString()
    });
    toast({
      title: "공정 업데이트",
      description: `세탁물이 [${nextStatus}] 단계로 이동되었습니다.`,
    });
  };

  if (isUserLoading) return <div className="p-8 text-center">인증 대기 중...</div>;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Kanban className="h-5 w-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900">공정 관리 칸반</h1>
          </div>
          <p className="text-muted-foreground text-sm">입고된 세탁물의 실시간 공정 상태를 추적하고 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2 h-11 border-slate-200">
            <ListFilter className="h-4 w-4" /> 필터링
          </Button>
          <Button className="bg-purple-700 rounded-xl px-6 h-11 shadow-lg shadow-purple-200">
            신규 입고 등록
          </Button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[75vh]">
        {columns.map((col, idx) => {
          const columnRequests = requests?.filter(r => r.currentStatus === col.status) || [];
          return (
            <div key={col.status} className="flex-shrink-0 w-80 space-y-4">
              <div className="flex items-center justify-between px-3 py-1">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.color}`}></div>
                  <h2 className="font-bold text-slate-700 text-sm">{col.title}</h2>
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold">
                  {columnRequests.length}
                </Badge>
              </div>
              
              <div className="kanban-column bg-slate-100/40 p-3 rounded-2xl min-h-[600px] border border-slate-200/50">
                {isLoading ? (
                  <div className="flex items-center justify-center h-20 text-xs text-slate-400 italic">로딩 중...</div>
                ) : columnRequests.map((req) => (
                  <Card key={req.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all mb-4 bg-white overflow-hidden group">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{req.hospitalName}</h3>
                          <p className="text-[10px] text-slate-400 font-mono">#{req.id.slice(-6).toUpperCase()}</p>
                        </div>
                        {req.isContaminated && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-[9px] bg-red-50 text-red-600 border-red-100">오염물</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] bg-slate-50 px-2 py-1 rounded-lg text-slate-500 border border-slate-100">
                          <Package className="h-3 w-3" />
                          <span>{req.requestDate} 수거건</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 italic">
                          {new Date(req.updatedAt || req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {idx < columns.length - 1 && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-[11px] font-bold text-primary gap-1 px-3 bg-primary/5 hover:bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-all"
                            onClick={() => handleStatusChange(req.id, columns[idx + 1].status)}
                          >
                            진행 <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!isLoading && columnRequests.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Package className="h-6 w-6 opacity-20" />
                    <span className="text-[10px] font-bold">항목 없음</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
