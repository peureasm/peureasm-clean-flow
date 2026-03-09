
"use client"

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hospital as HospitalIcon, MapPin, Phone, ChevronRight, Loader2, Search, Navigation } from 'lucide-react';
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
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      <p className="text-muted-foreground font-bold">거점 정보를 조회 중입니다...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <section className="space-y-1">
        <h1 className="text-24px font-black text-foreground">배정 거점 관리</h1>
        <p className="text-muted-foreground text-sm font-medium">나에게 배정된 담당 병원 목록입니다.</p>
      </section>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          className="pl-11 rounded-2xl bg-white border-border shadow-sm h-14 font-medium focus:ring-secondary" 
          placeholder="병원명 또는 주소 검색..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredHospitals.length > 0 ? (
          filteredHospitals.map((hosp) => (
            <Link key={hosp.id} href={`/driver/hospitals/${hosp.id}`}>
              <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-border hover:ring-secondary/30 hover:shadow-md transition-all group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-5">
                    <div className="p-3 bg-secondary/5 rounded-2xl text-secondary group-hover:bg-secondary group-hover:text-white transition-all shadow-sm">
                      <HospitalIcon className="h-6 w-6" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-slate-300 hover:text-secondary hover:bg-accent">
                        <Navigation className="h-5 w-5" />
                      </Button>
                      <ChevronRight className="h-10 w-10 p-2 text-slate-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-black text-foreground group-hover:text-secondary transition-colors">{hosp.name}</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-bold">
                        <MapPin className="h-3.5 w-3.5 text-slate-300" />
                        <span className="line-clamp-1">{hosp.address}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-bold">
                        <Phone className="h-3.5 w-3.5 text-slate-300" />
                        <span>{hosp.contactPersonPhone || '연락처 미등록'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-[40px] bg-white space-y-4">
            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
              <HospitalIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold">배정된 거점 병원이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
