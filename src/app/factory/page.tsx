
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LaundryStatus } from '../lib/types';
import { DUMMY_REQUESTS } from '../lib/data';
import { AlertCircle, Clock, Package, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FactoryKanban() {
  const columns: { title: string; status: LaundryStatus; color: string }[] = [
    { title: '입고완료', status: '공장입고', color: 'bg-purple-500' },
    { title: '세탁중', status: '세탁중', color: 'bg-blue-500' },
    { title: '건조중', status: '건조중', color: 'bg-orange-500' },
    { title: '포장중', status: '포장완료', color: 'bg-indigo-500' },
    { title: '출고대기', status: '출고', color: 'bg-emerald-500' },
  ];

  const [requests, setRequests] = useState(DUMMY_REQUESTS);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">공정 칸반 보드</h1>
          <p className="text-muted-foreground">세탁물의 현재 공정 상태를 드래그하거나 상태 변경 버튼으로 관리하세요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">필터</Button>
          <Button className="bg-purple-700">신규 입고 등록</Button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[70vh]">
        {columns.map((col) => (
          <div key={col.status} className="flex-shrink-0 w-80 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${col.color}`}></div>
                <h2 className="font-bold text-slate-700">{col.title}</h2>
                <Badge variant="secondary" className="rounded-full">{requests.filter(r => r.status === col.status).length}</Badge>
              </div>
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </div>
            
            <div className="kanban-column bg-slate-100/50">
              {requests.filter(r => r.status === col.status).map((req) => (
                <KanbanCard key={req.id} request={req} />
              ))}
              {requests.filter(r => r.status === col.status).length === 0 && (
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

function KanbanCard({ request }: { request: any }) {
  const totalQty = request.items.reduce((acc: any, curr: any) => acc + (curr.factoryQty || curr.driverQty || curr.hospitalQty), 0);
  
  return (
    <Card className="rounded-xl border-none shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing mb-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-bold text-sm">{request.hospitalName}</h3>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{request.id}</p>
          </div>
          {request.flags.isContaminated && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold">
            <Package className="h-3 w-3 text-slate-500" />
            <span>총 {totalQty}개</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold">
            <Clock className="h-3 w-3 text-slate-500" />
            <span>13:00 입고</span>
          </div>
        </div>

        <div className="pt-2 flex gap-1">
          {request.items.slice(0, 2).map((i: any) => (
            <Badge key={i.itemId} variant="outline" className="text-[9px] px-1 py-0 border-slate-200">{i.itemName}</Badge>
          ))}
          {request.items.length > 2 && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-200">+{request.items.length - 2}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
