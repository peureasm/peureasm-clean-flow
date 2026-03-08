"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, Save, Send, ChevronLeft, Trash2, Loader2 } from 'lucide-react';
import { LAUNDRY_ITEMS } from '@/app/lib/data';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';

export default function NewRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  // 사용자 및 병원 정보 가져오기
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !userData?.hospitalId) return null;
    return doc(firestore, 'hospitals', userData.hospitalId);
  }, [firestore, userData?.hospitalId]);

  const { data: hospital, isLoading: isHospLoading } = useDoc(hospitalRef);

  const [items, setItems] = useState<any[]>(
    LAUNDRY_ITEMS.map(item => ({ ...item, qty: 0 }))
  );
  const [flags, setFlags] = useState({
    contaminated: false,
    leaking: false,
    doublePacked: false,
    labeled: false
  });
  const [notes, setNotes] = useState('');
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
    ));
  };

  const handleQuickAdd = (id: string, amount: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, qty: item.qty + amount } : item
    ));
  };

  const isSubmitDisabled = items.reduce((acc, curr) => acc + curr.qty, 0) === 0 || isSubmitting || !hospital;

  const handleSubmit = () => {
    if (!firestore || !user || !hospital) return;

    setIsSubmitting(true);
    const requestRef = doc(collection(firestore, 'collectionRequests'));
    const requestId = requestRef.id;

    const requestData = {
      id: requestId,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      requestorId: user.uid,
      requestDate: requestDate,
      currentStatus: '제출',
      specialNotes: notes,
      isContaminated: flags.contaminated,
      isLeaking: flags.leaking,
      isDoublePacked: flags.doublePacked,
      hasLabels: flags.labeled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(requestRef, requestData, { merge: true });

    items.filter(i => i.qty > 0).forEach(i => {
      const itemRef = doc(collection(firestore, `collectionRequests/${requestId}/items`));
      setDocumentNonBlocking(itemRef, {
        id: itemRef.id,
        collectionRequestId: requestId,
        hospitalId: hospital.id,
        laundryItemId: i.id,
        itemName: i.name,
        requestedQuantity: i.qty,
      }, { merge: true });
    });

    setTimeout(() => {
      toast({
        title: "요청 제출 완료",
        description: `${hospital.name}의 세탁 수거 요청이 정상적으로 등록되었습니다.`,
      });
      router.push('/hospital');
    }, 500);
  };

  if (isHospLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-slate-500">병원 정보를 동기화 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen pb-32">
      <div className="sticky top-0 z-20 bg-white border-b p-4 flex items-center justify-between">
        <Link href="/hospital" className="p-1 hover:bg-slate-50 rounded-full transition-colors">
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </Link>
        <h1 className="text-lg font-black text-slate-900">수거 요청 등록</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-6">
        <section className="bg-primary/5 p-5 rounded-3xl border border-primary/10">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">요청 병원</p>
          <p className="font-black text-slate-900 text-lg">{hospital?.name || '정보 없음'}</p>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">수거 요청일</Label>
            <Input 
              id="date" 
              type="date" 
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="rounded-2xl border-none shadow-sm h-12 bg-white font-bold" 
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">품목 및 수량</h2>
          {items.map((item) => (
            <Card key={item.id} className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-5 space-y-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-black text-slate-800 text-base">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">단위: {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 rounded-full border-slate-100 bg-slate-50 hover:bg-slate-100"
                      onClick={() => updateQty(item.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-black text-2xl text-primary">{item.qty}</span>
                    <Button 
                      variant="default" 
                      size="icon" 
                      className="h-10 w-10 rounded-full shadow-lg shadow-primary/20"
                      onClick={() => updateQty(item.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[10, 20, 50].map((num) => (
                    <Button 
                      key={num} 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-9 rounded-xl text-xs border-none bg-slate-50 text-slate-600 hover:bg-primary hover:text-white"
                      onClick={() => handleQuickAdd(item.id, num)}
                    >
                      +{num}
                    </Button>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => updateQty(item.id, -item.qty)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> 비우기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">상태 체크</h2>
          <Card className="rounded-3xl border-none shadow-sm bg-white">
            <CardContent className="p-5 grid grid-cols-2 gap-4">
              {[
                { id: 'contaminated', label: '오염물 포함', key: 'contaminated' },
                { id: 'leak', label: '누수 주의', key: 'leaking' },
                { id: 'double', label: '이중 포장', key: 'doublePacked' },
                { id: 'label', label: '표시 완료', key: 'labeled' }
              ].map(flag => (
                <div key={flag.id} className="flex items-center space-x-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 hover:border-primary/30 transition-colors">
                  <Checkbox 
                    id={flag.id} 
                    checked={(flags as any)[flag.key]} 
                    onCheckedChange={(v: any) => setFlags({...flags, [flag.key]: v})} 
                  />
                  <label htmlFor={flag.id} className="text-xs font-black text-slate-700 cursor-pointer">{flag.label}</label>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4 pb-12">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">기사님 전달 메모</h2>
          <Textarea 
            placeholder="특이사항이나 요청사항을 적어주세요." 
            className="rounded-3xl border-none shadow-sm min-h-[140px] resize-none bg-white p-5 font-bold text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t flex gap-3 z-30 max-w-lg mx-auto shadow-2xl">
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold gap-2 border-slate-200 hover:bg-slate-50">
          <Save className="h-5 w-5" />
          임시저장
        </Button>
        <Button 
          className="flex-[2] h-14 rounded-2xl font-black text-lg gap-2 shadow-xl shadow-primary/30 bg-primary"
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          수거요청 제출
        </Button>
      </div>
    </div>
  );
}
