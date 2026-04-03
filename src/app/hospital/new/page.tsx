
"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, Save, Send, ChevronLeft, Trash2, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';

export default function NewRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

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

  // 전체 품목 리스트 조회 (Firestore에서 실시간으로 가져옴)
  const itemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'laundryItems'), orderBy('name'));
  }, [firestore]);

  const { data: globalItems, isLoading: isItemsLoading } = useCollection(itemsQuery);

  const [items, setItems] = useState<any[]>([]);
  const [flags, setFlags] = useState({
    contaminated: false,
    leaking: false,
    doublePacked: false,
    labeled: false
  });
  const [notes, setNotes] = useState('');
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 병원에 배정된 품목만 필터링하여 초기화
  useEffect(() => {
    if (globalItems && hospital) {
      const assignedIds = hospital.assignedItemIds || [];
      const filtered = globalItems
        .filter(item => assignedIds.includes(item.id))
        .map(item => ({ ...item, qty: 0 }));
      setItems(filtered);
    }
  }, [globalItems, hospital]);

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
    ));
  };

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

  if (isHospLoading || isItemsLoading) return <div className="p-20 text-center font-bold text-slate-400">품목 정보를 구성 중입니다...</div>;

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen pb-48">
      <div className="sticky top-0 z-20 bg-white border-b p-4 flex items-center justify-between soft-shadow">
        <Link href="/hospital" className="p-2 hover:bg-muted rounded-full">
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">수거 요청 등록</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-8">
        <section className="bg-accent/50 p-6 rounded-2xl border border-primary/10">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">요청 병원</p>
          <p className="font-black text-foreground text-xl">{hospital?.name || '정보 없음'}</p>
        </section>

        <section className="space-y-4">
          <Label className="text-[12px] font-bold text-muted-foreground uppercase px-1">수거 요청일</Label>
          <Input 
            type="date" 
            value={requestDate}
            onChange={(e) => setRequestDate(e.target.value)}
            className="rounded-xl border-border bg-muted font-bold text-foreground h-14" 
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase px-1 flex justify-between items-center">
            세탁 품목 및 수량
            <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5">
              {items.length}개 품목 배정됨
            </Badge>
          </h2>
          
          {items.length > 0 ? (
            items.map((item) => (
              <Card key={item.id} className="border-none shadow-sm bg-white overflow-hidden ring-1 ring-border/50">
                <CardContent className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-black text-foreground text-lg">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">단위: {item.unit} / ₩{item.pricePerUnit.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-5">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-10 w-10 rounded-full bg-slate-50 border-slate-200"
                        onClick={() => updateQty(item.id, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-black text-2xl text-primary">{item.qty}</span>
                      <Button 
                        variant="default" 
                        size="icon" 
                        className="h-10 w-10 rounded-full bg-primary shadow-lg shadow-primary/20"
                        onClick={() => updateQty(item.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 50].map((num) => (
                      <Button 
                        key={num} 
                        variant="outline" 
                        size="sm" 
                        className="h-9 rounded-xl text-[11px] font-black border-slate-100 bg-slate-50 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                        onClick={() => updateQty(item.id, num)}
                      >
                        +{num}
                      </Button>
                    ))}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 rounded-xl text-destructive hover:bg-destructive/5 font-bold"
                      onClick={() => updateQty(item.id, -item.qty)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 px-6">
              <Info className="h-10 w-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 font-bold text-sm leading-relaxed">
                배정된 품목이 없습니다.<br/>
                관리자에게 품목 배정을 요청해 주세요.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase px-1">특이사항 체크</h2>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              {[
                { id: 'contaminated', label: '오염물 포함', key: 'contaminated' },
                { id: 'leak', label: '누수 주의', key: 'leaking' },
                { id: 'double', label: '이중 포장', key: 'doublePacked' },
                { id: 'label', label: '표시 완료', key: 'labeled' }
              ].map(flag => (
                <div key={flag.id} className="flex items-center space-x-3 bg-muted/50 p-4 rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer">
                  <Checkbox 
                    id={flag.id} 
                    checked={(flags as any)[flag.key]} 
                    onCheckedChange={(v: any) => setFlags({...flags, [flag.key]: v})} 
                  />
                  <label htmlFor={flag.id} className="text-xs font-bold text-foreground cursor-pointer">{flag.label}</label>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4 pb-12">
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase px-1">전달 메모</h2>
          <Textarea 
            placeholder="기사님에게 전달할 요청사항을 입력해 주세요." 
            className="rounded-2xl border-border bg-white p-5 font-medium text-sm min-h-[120px] focus:ring-primary"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t flex gap-3 z-30 max-w-lg mx-auto soft-shadow">
        <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold" onClick={() => router.back()}>취소</Button>
        <Button 
          className="flex-[2] h-14 rounded-xl font-black text-lg gap-2 bg-primary text-white shadow-xl shadow-primary/20"
          disabled={items.reduce((acc, curr) => acc + curr.qty, 0) === 0 || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          수거요청 제출
        </Button>
      </div>
    </div>
  );
}
