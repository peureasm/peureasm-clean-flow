
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Plus, Package, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { DUMMY_REQUESTS } from '../lib/data';
import StatusBadge from '@/components/shared/StatusBadge';

export default function HospitalDashboard() {
  const myRequests = DUMMY_REQUESTS.filter(r => r.hospitalId === 'h1');
  const recentRequest = myRequests[0];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto sm:max-w-7xl">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">반갑습니다, 김철수님</h1>
        <p className="text-muted-foreground">오늘의 세탁물 수거 현황입니다.</p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
            <Package className="h-8 w-8 text-primary" />
            <p className="text-2xl font-bold">12건</p>
            <p className="text-xs text-muted-foreground">금월 총 요청</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-secondary/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
            <Clock className="h-8 w-8 text-secondary" />
            <p className="text-2xl font-bold">2건</p>
            <p className="text-xs text-muted-foreground">수거 대기</p>
          </CardContent>
        </Card>
      </div>

      <Link href="/hospital/new">
        <Button className="w-full h-14 rounded-2xl text-lg font-bold flex gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-6 w-6" />
          신규 수거 요청 등록
        </Button>
      </Link>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">최근 요청 내역</h2>
          <Link href="/hospital/requests" className="text-sm text-primary font-medium flex items-center">
            전체보기 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {myRequests.map((req) => (
          <Card key={req.id} className="rounded-2xl overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <Link href={`/hospital/requests/${req.id}`} className="block p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{req.id}</p>
                    <p className="font-bold">{req.requestDate} 수거 건</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{req.items.reduce((acc, curr) => acc + curr.hospitalQty, 0)}개 품목</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{req.preferredTime}</span>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="bg-slate-900 text-white rounded-2xl border-none">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">납품 확인 필요</h3>
            <Badge className="bg-secondary text-secondary-foreground">NEW</Badge>
          </div>
          <p className="text-sm text-slate-300">방금 기사가 서울메디컬병원에 20건의 세탁물 납품을 완료했습니다. 수량을 확인해주세요.</p>
          <Button variant="secondary" className="w-full rounded-xl font-bold">확인하러 가기</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Badge({ children, className }: any) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}
