
"use client"

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Phone, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { DUMMY_REQUESTS } from '../lib/data';

export default function DriverDashboard() {
  const collectionList = DUMMY_REQUESTS.filter(r => r.status === '제출');
  const deliveryList = DUMMY_REQUESTS.filter(r => r.status === '출고');

  return (
    <div className="p-4 space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">수거 및 납품 경로</h1>
        <p className="text-gray-400 text-sm">오늘 예정된 일정 5건 중 2건 완료</p>
      </section>

      <div className="space-y-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-secondary"></div>
          다음 수거 장소
        </h2>

        {collectionList.length > 0 ? (
          <Card className="bg-gray-800 border-none shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{collectionList[0].hospitalName}</h3>
                    <p className="text-sm text-gray-400">서울시 강남구 테헤란로 123</p>
                  </div>
                  <Badge className="bg-blue-600">수거대기</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="border-gray-700 bg-gray-800 rounded-xl gap-2 h-12">
                    <Phone className="h-4 w-4" /> 전화하기
                  </Button>
                  <Button className="bg-secondary text-secondary-foreground rounded-xl gap-2 h-12 font-bold">
                    <Navigation className="h-4 w-4" /> 길안내
                  </Button>
                </div>
              </div>
              <Link href={`/driver/collection/${collectionList[0].id}`}>
                <div className="bg-gray-750 p-4 border-t border-white/5 flex items-center justify-between hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center">
                      <ClipboardCheck className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">수거 확인 진행</p>
                      <p className="text-xs text-gray-400">환자복 외 2건 예정</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </div>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="p-8 text-center text-gray-500">대기 중인 수거 일정이 없습니다.</div>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase">남은 일정 목록</h2>
        
        <div className="space-y-3">
          {deliveryList.map((req) => (
            <Card key={req.id} className="bg-gray-800 border-none rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-bold">{req.hospitalName}</p>
                    <p className="text-xs text-gray-400">납품 대기 중 • 14:00 예정</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </CardContent>
            </Card>
          ))}

          <Card className="bg-gray-800 border-none rounded-2xl opacity-60">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold">아산종합병원</p>
                  <p className="text-xs text-gray-400">수거 완료 • 09:30</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-500">완료</Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="bg-orange-500/10 border border-orange-500/20 rounded-2xl">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-orange-500">공장 지연 알림</p>
            <p className="text-xs text-orange-200">세탁 공장 설비 점검으로 인해 오후 납품 일정이 30분 정도 지연될 수 있습니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClipboardCheck({ className }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>
    </svg>
  );
}
