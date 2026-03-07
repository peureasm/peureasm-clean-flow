
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hospital, Plus, Search, MapPin, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminHospitalsPage() {
  // 실제 운영 시에는 /hospitals 컬렉션을 조회하도록 구현
  const dummyHospitals = [
    { id: 'h1', name: '서울메디컬병원', address: '서울시 강남구', contact: '02-1234-5678', status: 'Active' },
    { id: 'h2', name: '연세세브란스(신촌)', address: '서울시 서대문구', contact: '02-888-9999', status: 'Active' },
    { id: 'h3', name: '아산종합병원', address: '서울시 송파구', contact: '02-777-6666', status: 'Inactive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">병원 관리</h1>
          <p className="text-muted-foreground">세탁 서비스를 이용 중인 병원 고객사를 관리합니다.</p>
        </div>
        <Button className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> 신규 병원 등록
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-10 rounded-xl bg-white border-none shadow-sm" placeholder="병원명 또는 주소로 검색..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyHospitals.map((hosp) => (
          <Card key={hosp.id} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-primary/5 rounded-xl text-primary">
                  <Hospital className="h-6 w-6" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${hosp.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {hosp.status}
                </span>
              </div>
              <CardTitle className="text-xl font-bold mt-4">{hosp.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span>{hosp.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Phone className="h-4 w-4" />
                  <span>{hosp.contact}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full rounded-xl">상세 정보 / 설정</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
