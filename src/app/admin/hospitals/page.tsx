
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hospital as HospitalIcon, Plus, Search, MapPin, Phone, User, Loader2, BarChart3, Truck, Share2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, limit, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminHospitalsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<any>(null);
  const [deletingHospital, setDeletingHospital] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const firestore = useFirestore();
  const { toast } = useToast();

  const hospitalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'hospitals'), limit(100));
  }, [firestore]);

  const { data: hospitals, isLoading } = useCollection(hospitalsQuery);

  const filteredHospitals = hospitals?.filter(h => 
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    let formattedValue = value;
    
    if (value.length > 3 && value.length <= 7) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length > 7) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }
    
    setPhoneValue(formattedValue);
  };

  const handleOpenAdd = () => {
    setEditingHospital(null);
    setPhoneValue("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (hosp: any) => {
    setEditingHospital(hosp);
    setPhoneValue(hosp.contactPersonPhone || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const hospitalData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      contactPersonName: formData.get('contactPersonName') as string,
      contactPersonPhone: phoneValue,
      updatedAt: new Date().toISOString()
    };

    if (editingHospital) {
      updateDocumentNonBlocking(doc(firestore, 'hospitals', editingHospital.id), hospitalData);
      toast({ title: "정보 수정 완료", description: "병원 정보가 업데이트되었습니다." });
    } else {
      const newHospital = {
        ...hospitalData,
        registrationDate: new Date().toISOString(),
        status: 'Active',
        assignedDriverId: null,
        assignedDriverName: null
      };
      await addDocumentNonBlocking(collection(firestore, 'hospitals'), newHospital);
      toast({ title: "병원 등록 완료", description: "신규 병원이 등록되었습니다." });
    }

    setIsSubmitting(false);
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (!firestore || !deletingHospital) return;
    deleteDocumentNonBlocking(doc(firestore, 'hospitals', deletingHospital.id));
    toast({ title: "병원 삭제 완료", description: "병원이 시스템에서 제거되었습니다." });
    setDeletingHospital(null);
  };

  const handleQuickShare = (hosp: any) => {
    if (typeof window === 'undefined') return;
    const inviteLink = `${window.location.origin}/hospital?inviteId=${hosp.id}&name=${encodeURIComponent(hosp.name)}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "초대 링크 복사됨",
      description: `${hosp.name} 담당자 전용 링크가 복사되었습니다.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">병원 관리</h1>
          <p className="text-muted-foreground font-medium text-sm">시스템을 이용 중인 병원 고객사를 조회하고 관리합니다.</p>
        </div>
        
        <Button onClick={handleOpenAdd} className="rounded-xl gap-2 h-12 px-6 shadow-lg shadow-primary/20">
          <Plus className="h-5 w-5" /> 신규 병원 등록
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          className="w-full pl-10 rounded-xl bg-white border-none shadow-sm h-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
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
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full h-8 w-8 text-slate-300 hover:text-primary"
                      onClick={() => handleQuickShare(hosp)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-300">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="gap-2 font-bold cursor-pointer" onClick={() => handleOpenEdit(hosp)}>
                          <Pencil className="h-4 w-4" /> 수정
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 font-bold text-destructive cursor-pointer" onClick={() => setDeletingHospital(hosp)}>
                          <Trash2 className="h-4 w-4" /> 삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardTitle className="text-xl font-black mt-4 text-slate-900 line-clamp-1">{hosp.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 text-slate-300" />
                    <span className="font-medium line-clamp-1">{hosp.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-500">
                    <Truck className="h-4 w-4 text-slate-300" />
                    <span className="font-bold text-primary">{hosp.assignedDriverName || '전담 기사 없음'}</span>
                  </div>
                </div>
                <div className="pt-4 flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-10 border-slate-100 text-slate-600 font-bold hover:bg-slate-50" asChild>
                    <Link href={`/admin/hospitals/${hosp.id}`}>상세 및 배정</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
          <HospitalIcon className="h-12 w-12 mx-auto mb-4 text-slate-200" />
          <p className="text-slate-400 font-bold">등록된 병원이 없습니다.</p>
        </div>
      )}

      {/* Hospital Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingHospital ? "병원 정보 수정" : "신규 병원 등록"}</DialogTitle>
              <DialogDescription className="text-xs">
                병원의 마스터 정보를 입력해 주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-400">병원명</Label>
                <Input id="name" name="name" defaultValue={editingHospital?.name || ""} placeholder="예: 서울메디컬병원" className="rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-bold uppercase text-slate-400">주소</Label>
                <Input id="address" name="address" defaultValue={editingHospital?.address || ""} placeholder="예: 서울시 강남구..." className="rounded-xl" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPersonName" className="text-xs font-bold uppercase text-slate-400">담당자 성함</Label>
                  <Input id="contactPersonName" name="contactPersonName" defaultValue={editingHospital?.contactPersonName || ""} placeholder="김철수" className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPersonPhone" className="text-xs font-bold uppercase text-slate-400">연락처</Label>
                  <Input 
                    id="contactPersonPhone" 
                    name="contactPersonPhone" 
                    placeholder="010-0000-0000" 
                    className="rounded-xl" 
                    value={phoneValue}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    required 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full rounded-xl h-12 font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editingHospital ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {editingHospital ? "정보 저장하기" : "병원 정보 저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deletingHospital} onOpenChange={(open) => !open && setDeletingHospital(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              [{deletingHospital?.name}] 병원 정보를 삭제합니다. 이 작업은 되돌릴 수 없으며 배정된 기사 정보에도 영향을 줄 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-bold">병원 삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
