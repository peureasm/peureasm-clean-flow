
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hospital as HospitalIcon, Plus, Search, MapPin, Phone, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function AdminHospitalsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  // Firestore에서 병원 목록 실시간 조회
  const hospitalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'hospitals'), limit(100));
  }, [firestore]);

  const { data: hospitals, isLoading } = useCollection(hospitalsQuery);

  const filteredHospitals = hospitals?.filter(h => 
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddHospital = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const newHospital = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      contactPersonName: formData.get('contactPersonName') as string,
      contactPersonPhone: formData.get('contactPersonPhone') as string,
      registrationDate: new Date().toISOString(),
      status: 'Active'
    };

    const hospitalsRef = collection(firestore, 'hospitals');
    addDocumentNonBlocking(hospitalsRef, newHospital)
      .then(() => {
        toast({
          title: "병원 등록 완료",
          description: `${newHospital.name}이(가) 시스템에 등록되었습니다.`,
        });
        setIsDialogOpen(false);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">병원 관리</h1>
          <p className="text-muted-foreground font-medium text-sm">시스템을 이용 중인 병원 고객사를 조회하고 등록합니다.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 h-12 px-6 shadow-lg shadow-primary/20">
              <Plus className="h-5 w-5" /> 신규 병원 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <form onSubmit={handleAddHospital}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">신규 병원 등록</DialogTitle>
                <DialogDescription className="text-xs">
                  새로운 병원 고객사의 기본 정보를 입력해 주세요.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-400">병원명</Label>
                  <Input id="name" name="name" placeholder="예: 서울메디컬병원" className="rounded-xl border-slate-200" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-bold uppercase text-slate-400">주소</Label>
                  <Input id="address" name="address" placeholder="예: 서울시 강남구..." className="rounded-xl border-slate-200" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonName" className="text-xs font-bold uppercase text-slate-400">담당자 성함</Label>
                    <Input id="contactPersonName" name="contactPersonName" placeholder="김철수" className="rounded-xl border-slate-200" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonPhone" className="text-xs font-bold uppercase text-slate-400">연락처</Label>
                    <Input id="contactPersonPhone" name="contactPersonPhone" placeholder="010-0000-0000" className="rounded-xl border-slate-200" required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full rounded-xl h-12 font-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  병원 정보 저장
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
          placeholder="병원명 또는 주소로 검색..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">병원 목록을 불러오는 중...</p>
        </div>
      ) : filteredHospitals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((hosp) => (
            <Card key={hosp.id} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden hover:shadow-md transition-all group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <HospitalIcon className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                    hosp.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {hosp.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
                <CardTitle className="text-xl font-black mt-4 text-slate-900">{hosp.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 text-slate-300" />
                    <span className="font-medium line-clamp-1">{hosp.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-500">
                    <User className="h-4 w-4 text-slate-300" />
                    <span className="font-medium">{hosp.contactPersonName || '담당자 미정'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-500">
                    <Phone className="h-4 w-4 text-slate-300" />
                    <span className="font-medium">{hosp.contactPersonPhone || '연락처 미정'}</span>
                  </div>
                </div>
                <div className="pt-4 flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-10 border-slate-100 text-slate-600 font-bold hover:bg-slate-50">상세</Button>
                  <Button variant="ghost" className="flex-1 rounded-xl h-10 text-primary font-bold hover:bg-primary/5">통계</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
          <HospitalIcon className="h-12 w-12 mx-auto mb-4 text-slate-200" />
          <p className="text-slate-400 font-bold">등록된 병원이 없습니다.</p>
          <p className="text-xs text-slate-300 mt-1">상단의 '신규 병원 등록' 버튼을 눌러 추가해 보세요.</p>
        </div>
      )}
    </div>
  );
}
