
"use client"

import { useState, useEffect } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Hospital as HospitalIcon, Save, MapPin, Phone, User, Loader2 } from 'lucide-react';

export default function HospitalSettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");

  // 1. 사용자 프로필에서 소속 병원 ID 가져오기
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userDocRef);

  // 2. 병원 마스터 정보 가져오기
  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !userData?.hospitalId) return null;
    return doc(firestore, 'hospitals', userData.hospitalId);
  }, [firestore, userData?.hospitalId]);
  const { data: hospital, isLoading } = useDoc(hospitalRef);

  useEffect(() => {
    if (hospital?.contactPersonPhone) {
      setPhoneValue(hospital.contactPersonPhone);
    }
  }, [hospital]);

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

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !userData?.hospitalId) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const updatedData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      contactPersonName: formData.get('contactPersonName') as string,
      contactPersonPhone: phoneValue,
      updatedAt: new Date().toISOString()
    };

    updateDocumentNonBlocking(doc(firestore, 'hospitals', userData.hospitalId), updatedData);
    
    setTimeout(() => {
      toast({
        title: "정보 수정 완료",
        description: "병원 마스터 정보가 성공적으로 업데이트되었습니다.",
      });
      setIsSubmitting(false);
    }, 500);
  };

  if (isLoading) return <div className="p-12 text-center text-slate-400 font-bold">병원 정보를 불러오는 중...</div>;
  if (!hospital) return <div className="p-12 text-center text-slate-400 font-bold">소속된 병원 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <header className="py-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">병원 정보 관리</h1>
        <p className="text-sm text-muted-foreground">시스템에 등록된 병원 마스터 정보를 관리합니다.</p>
      </header>

      <form onSubmit={handleUpdate}>
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                <HospitalIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">마스터 프로필</CardTitle>
                <p className="text-[10px] font-bold text-primary/60 uppercase">Hospital Identity</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">병원명</Label>
                <div className="relative">
                  <HospitalIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input id="name" name="name" defaultValue={hospital.name} className="pl-10 rounded-xl bg-slate-50 border-none h-12 font-bold" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">주소</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input id="address" name="address" defaultValue={hospital.address} className="pl-10 rounded-xl bg-slate-50 border-none h-12 font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPersonName" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">대표 담당자</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input id="contactPersonName" name="contactPersonName" defaultValue={hospital.contactPersonName} className="pl-10 rounded-xl bg-slate-50 border-none h-12 font-bold" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPersonPhone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">연락처</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input 
                      id="contactPersonPhone" 
                      name="contactPersonPhone" 
                      value={phoneValue}
                      onChange={handlePhoneChange}
                      maxLength={13}
                      className="pl-10 rounded-xl bg-slate-50 border-none h-12 font-bold" 
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                * 병원 마스터 정보 수정 시, 모든 시스템 관리자 및 기사에게 변경 사항이 즉시 공유됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-20 sm:bottom-4 left-0 right-0 p-4 max-w-lg mx-auto z-30">
          <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl font-bold gap-2 shadow-xl shadow-primary/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            병원 정보 업데이트 저장
          </Button>
        </div>
      </form>
    </div>
  );
}
