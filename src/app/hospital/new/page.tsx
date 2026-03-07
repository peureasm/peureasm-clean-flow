
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, Camera, Save, Send, ChevronLeft, Trash2 } from 'lucide-react';
import { LAUNDRY_ITEMS } from '@/app/lib/data';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function NewRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>(
    LAUNDRY_ITEMS.map(item => ({ ...item, qty: 0 }))
  );
  const [flags, setFlags] = useState({
    contaminated: false,
    leaking: false,
    doublePacked: false,
    labeled: false
  });

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

  const isSubmitDisabled = items.reduce((acc, curr) => acc + curr.qty, 0) === 0;

  const handleSubmit = () => {
    toast({
      title: "요청 제출 완료",
      description: "세탁 수거 요청이 정상적으로 등록되었습니다.",
    });
    router.push('/hospital');
  };

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="sticky top-0 z-20 bg-white border-b p-4 flex items-center justify-between">
        <Link href="/hospital" className="p-1">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold">수거 요청 등록</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-bold text-muted-foreground uppercase">수거 요청일</Label>
              <Input id="date" type="date" defaultValue="2024-05-01" className="rounded-xl border-none shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time" className="text-xs font-bold text-muted-foreground uppercase">희망 시간</Label>
              <Input id="time" type="text" defaultValue="오전 10:00" className="rounded-xl border-none shadow-sm" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase px-1">품목 및 수량 입력</h2>
          {items.map((item) => (
            <Card key={item.id} className="rounded-2xl border-none shadow-sm overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">단위: {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateQty(item.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-lg">{item.qty}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-full border-primary text-primary"
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
                      variant="secondary" 
                      size="sm" 
                      className="flex-1 h-8 rounded-lg text-xs font-bold"
                      onClick={() => handleQuickAdd(item.id, num)}
                    >
                      +{num}
                    </Button>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-lg text-destructive"
                    onClick={() => updateQty(item.id, -item.qty)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase px-1">상태 체크</h2>
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="contam" checked={flags.contaminated} onCheckedChange={(v: any) => setFlags({...flags, contaminated: v})} />
                <label htmlFor="contam" className="text-sm font-medium">오염물 포함</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="leak" checked={flags.leaking} onCheckedChange={(v: any) => setFlags({...flags, leaking: v})} />
                <label htmlFor="leak" className="text-sm font-medium">누수 주의</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="double" checked={flags.doublePacked} onCheckedChange={(v: any) => setFlags({...flags, doublePacked: v})} />
                <label htmlFor="double" className="text-sm font-medium">이중 포장</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="label" checked={flags.labeled} onCheckedChange={(v: any) => setFlags({...flags, labeled: v})} />
                <label htmlFor="label" className="text-sm font-medium">표시 완료</label>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4 pb-12">
          <h2 className="text-sm font-bold text-muted-foreground uppercase px-1">사진 및 메모</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square bg-slate-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400">
              <Camera className="h-6 w-6" />
              <span className="text-[10px] mt-1 font-bold">사진 추가</span>
            </div>
          </div>
          <Textarea 
            placeholder="기사님께 전달할 특이사항을 적어주세요." 
            className="rounded-2xl border-none shadow-sm min-h-[100px] resize-none"
          />
        </section>
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t flex gap-3 z-30 max-w-lg mx-auto">
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold gap-2">
          <Save className="h-5 w-5" />
          임시저장
        </Button>
        <Button 
          className="flex-[2] h-14 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20"
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
        >
          <Send className="h-5 w-5" />
          수거요청 제출
        </Button>
      </div>
    </div>
  );
}
