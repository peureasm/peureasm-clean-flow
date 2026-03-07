
"use client"

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronLeft, Search, Filter, Package, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { DUMMY_REQUESTS } from '@/app/lib/data';
import StatusBadge from '@/components/shared/StatusBadge';

export default function HospitalRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const myRequests = DUMMY_REQUESTS.filter(r => r.hospitalId === 'h1');

  const filteredRequests = myRequests.filter(req => 
    req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestDate.includes(searchTerm)
  );

  const getStatusCategory = (status: string) => {
    if (['제출', '수거완료', '공장입고', '세탁중', '건조중', '포장완료', '출고'].includes(status)) return 'ongoing';
    if (['납품완료', '병원확인완료', '종결'].includes(status)) return 'completed';
    return 'pending';
  };

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="sticky top-0 z-20 bg-white border-b p-4 flex items-center justify-between">
        <Link href="/hospital" className="p-1">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold">수거 및 납품 내역</h1>
        <Button variant="ghost" size="icon">
          <Filter className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="요청 ID 또는 날짜로 검색" 
            className="pl-10 rounded-xl border-none shadow-sm h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-xl bg-slate-100 p-1 h-12">
            <TabsTrigger value="all" className="rounded-lg font-bold">전체</TabsTrigger>
            <TabsTrigger value="ongoing" className="rounded-lg font-bold">진행 중</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg font-bold">완료</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-3">
            <TabsContent value="all" className="m-0 space-y-3">
              {filteredRequests.map((req) => (
                <RequestCard key={req.id} req={req} />
              ))}
            </TabsContent>
            <TabsContent value="ongoing" className="m-0 space-y-3">
              {filteredRequests.filter(r => getStatusCategory(r.status) === 'ongoing').map((req) => (
                <RequestCard key={req.id} req={req} />
              ))}
            </TabsContent>
            <TabsContent value="completed" className="m-0 space-y-3">
              {filteredRequests.filter(r => getStatusCategory(r.status) === 'completed').map((req) => (
                <RequestCard key={req.id} req={req} />
              ))}
            </TabsContent>
          </div>
        </Tabs>

        {filteredRequests.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <Package className="h-12 w-12 text-slate-200 mx-auto" />
            <p className="text-muted-foreground font-medium">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ req }: { req: any }) {
  const totalQty = req.items.reduce((acc: number, curr: any) => acc + curr.hospitalQty, 0);

  return (
    <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        <Link href={`/hospital/requests/${req.id}`} className="block p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                  {req.id}
                </span>
              </div>
              <h3 className="font-bold text-slate-900">{req.requestDate} 수거 요청</h3>
            </div>
            <StatusBadge status={req.status} />
          </div>

          <div className="flex items-center gap-4 text-[11px] text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{req.requestDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{req.preferredTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              <span>총 {totalQty}개</span>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
