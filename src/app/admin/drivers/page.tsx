
"use client"

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Search, Plus, Truck, User, Mail, Loader2, Hospital, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDriversPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  // 1. 기사(DRIVER) 목록 조회
  const driversQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'DRIVER'), limit(50));
  }, [firestore]);

  // 2. 전체 병원 목록 조회 (배정된 병원 수 계산용)
  const hospitalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'hospitals'));
  }, [firestore]);

  const { data: drivers, isLoading: isDriversLoading } = useCollection(driversQuery);
  const { data: hospitals } = useCollection(hospitalsQuery);

  const filteredDrivers = drivers?.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.username?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    
    // 수거 기사 UID 생성 (Prototype 용)
    const tempUid = `driver_${Math.random().toString(36).slice(2, 9)}`;
    const userRef = doc(firestore, 'users', tempUid);

    setDocumentNonBlocking(userRef, {
      id: tempUid,
      name: name,
      username: email,
      role: 'DRIVER',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "기사 계정 생성 완료",
      description: `${name} 기사님의 계정이 시스템에 등록되었습니다. (ID: ${tempUid})`,
    });
    setIsDialogOpen(false);
    setIsSubmitting(false);
  };

  const getAssignedHospitalCount = (driverId: string) => {
    return hospitals?.filter(h => h.assignedDriverId === driverId).length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">기사 계정 관리</h1>
          <p className="text-muted-foreground font-medium text-sm">시스템에 등록된 수거 기사들을 조회하고 계정을 생성합니다.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 h-12 px-6 shadow-lg shadow-primary/20 bg-primary">
              <Plus className="h-5 w-5" /> 신규 기사 계정 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <form onSubmit={handleAddDriver}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">기사 계정 생성</DialogTitle>
                <DialogDescription className="text-xs">
                  현장에서 수거 및 납품을 수행할 기사님의 정보를 입력하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-400">성함</Label>
                  <Input id="name" name="name" placeholder="예: 이민수" className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-400">아이디 (이메일)</Label>
                  <Input id="email" name="email" type="email" placeholder="driver@example.com" className="rounded-xl" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full rounded-xl h-12 font-bold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                  기사 계정 즉시 생성
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          className="pl-10 rounded-xl bg-white border-none shadow-sm h-12" 
          placeholder="기사명 또는 이메일로 검색..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isDriversLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">기사 목록 로딩 중...</p>
        </div>
      ) : filteredDrivers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => {
            const hospCount = getAssignedHospitalCount(driver.id);
            return (
              <Card key={driver.id} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden hover:shadow-md transition-all group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Truck className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-100 bg-emerald-50 text-emerald-600">ACTIVE</Badge>
                  </div>
                  <CardTitle className="text-xl font-black mt-4 text-slate-900">{driver.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-sm text-slate-500">
                      <Mail className="h-4 w-4 text-slate-300" />
                      <span className="font-medium">{driver.username}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-500">
                      <Hospital className="h-4 w-4 text-slate-300" />
                      <span className="font-bold text-primary">담당 병원: {hospCount}개</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
          <User className="h-12 w-12 mx-auto mb-4 text-slate-200" />
          <p className="text-slate-400 font-bold">등록된 기사가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
