
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
import { Search, Plus, Truck, User, Mail, Loader2, Hospital, ChevronRight, Share2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminDriversPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  // 1. 시스템에 등록된 실제 기사(DRIVER) 목록 조회
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

  const handleCopyGlobalInvite = () => {
    if (typeof window === 'undefined') return;
    const link = `${window.location.origin}/driver?driverInvite=true`;
    navigator.clipboard.writeText(link);
    toast({
      title: "기사 공용 초대 링크 복사",
      description: "새로운 기사님에게 전달할 전용 접속 링크가 복사되었습니다.",
    });
  };

  const handleAddDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    
    // 수동 등록 시 임시 ID 부여 (실제 로그인은 초대 링크 권장)
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
      title: "임시 기사 계정 생성",
      description: `${name} 기사님의 프로필이 생성되었습니다. (실제 접속 시 초대 링크 사용 권장)`,
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">기사 관리</h1>
          <p className="text-muted-foreground font-medium text-sm">시스템에 등록된 수거 기사들을 관리하고 배정 현황을 모니터링합니다.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none rounded-xl gap-2 h-12 border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={handleCopyGlobalInvite}>
            <Share2 className="h-4 w-4" /> 공용 초대 링크 복사
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 md:flex-none rounded-xl gap-2 h-12 px-6 shadow-lg shadow-primary/20 bg-primary">
                <Plus className="h-5 w-5" /> 기사 수동 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <form onSubmit={handleAddDriver}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">기사 프로필 생성</DialogTitle>
                  <DialogDescription className="text-xs">
                    기사님의 정보를 미리 등록합니다. 실제 시스템 사용을 위해서는 초대 링크를 통한 로그인이 필요합니다.
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
                    기사 프로필 생성
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                  <p className="text-[10px] font-mono text-slate-400 uppercase">ID: {driver.id}</p>
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
                  <div className="pt-4">
                    <Button variant="outline" className="w-full rounded-xl h-10 border-slate-100 text-slate-600 font-bold hover:bg-slate-50 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100" asChild>
                      <Link href={`/admin/drivers/${driver.id}`}>
                        상세 정보 및 이력 <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
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
          <p className="text-xs text-slate-300 mt-2">초대 링크를 기사님에게 공유하여 첫 기사를 등록하세요.</p>
        </div>
      )}
    </div>
  );
}
