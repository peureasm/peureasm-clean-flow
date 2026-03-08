
"use client"

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hospital as HospitalIcon, MapPin, Phone, ChevronRight, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function DriverHospitalsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  const assignedHospitalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'hospitals'),
      where('assignedDriverId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: hospitals, isLoading } = useCollection(assignedHospitalsQuery);

  const filteredHospitals = hospitals?.filter(h => 
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isUserLoading || isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-secondary" />
      <p className="text-slate-400 font-bold">담당 병원 목록을 불러오는 중...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <section className="space-y-2 py-4">
        <h1 className="text-2xl font-black text-white">담당 병원 관리</h1>
        <p className="text-slate-300 text-sm font-medium">나에게 배정된 거점 병원들을 확인하세요.</p>
      </section>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          className="pl-10 rounded-2xl bg-slate-800 border-none text-white h-12 focus:ring-secondary" 
          placeholder="병원명으로 검색..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredHospitals.length > 0 ? (
          filteredHospitals.map((hosp) => (
            <Link key={hosp.id} href={`/driver/hospitals/${hosp.id}`}>
              <Card className="bg-slate-800 border-none shadow-xl rounded-3xl overflow-hidden ring-1 ring-white/10 hover:ring-secondary/50 transition-all group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                      <HospitalIcon className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-6 w-6 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white">{hosp.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="line-clamp-1">{hosp.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span>{hosp.contactPersonPhone || '연락처 없음'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-slate-800/50">
            <HospitalIcon className="h-12 w-12 mx-auto mb-4 text-slate-600 opacity-20" />
            <p className="text-slate-500 font-bold">배정된 병원이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
