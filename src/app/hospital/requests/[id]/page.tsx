
"use client"

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronLeft, Clock, Package, AlertCircle, CheckCircle, 
  History, TrendingDown, ClipboardList, MessageSquare, CreditCard
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import { useDoc, useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export default function HospitalRequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'collectionRequests', id as string);
  }, [firestore, id]);

  const itemsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return collection(firestore, `collectionRequests/${id}/items`);
  }, [firestore, id]);

  const masterItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'laundryItems');
  }, [firestore]);

  const { data: request, isLoading: isReqLoading } = useDoc(requestRef);
  const { data: items, isLoading: isItemsLoading } = useCollection(itemsQuery);
  const { data: masterItems } = useCollection(masterItemsQuery);

  useEffect(() => {
    if (items && masterItems) {
      const total = items.reduce((acc, item) => {
        const master = masterItems.find(m => m.id === item.laundryItemId);
        const price = master?.pricePerUnit || 0;
        const qty = item.deliveredQuantity || item.verifiedQuantity || item.requestedQuantity || 0;
        return acc + (price * qty);
      }, 0);
      setTotalAmount(total);
    }
  }, [items, masterItems]);

  const handleFinalConfirm = () => {
    if (!firestore || !id) return;
    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', id as string), {
      currentStatus: '병원확인완료',
      hospitalFeedback: feedback,
      finalConfirmedAt: new Date().toISOString()
    });
    toast({
      title: "납품 확인 완료",
      description: "세탁물 납품을 확인하였습니다. 정산 절차로 진행됩니다.",
    });
  };

  if (isReqLoading || isItemsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm font-bold text-muted-foreground">세탁물 추적 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center space-y-4 bg-white min-h-screen">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
        <p className="font-bold text-xl">요청을 찾을 수 없습니다.</p>
        <Button onClick={() => router.push('/hospital')} className="rounded-2xl h-12 px-8">목록으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-[#F8FAFC] min-h-screen pb-48">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
        <Link href="/hospital/requests" className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-slate-900">세탁물 추적 정보</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4 space-y-6">
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 uppercase tracking-widest">
                ID: {request.id.slice(-12)}
              </span>
              <h2 className="text-2xl font-black text-slate-900">{request.hospitalName}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>요청일: {request.requestDate}</span>
              </div>
            </div>
            <StatusBadge status={request.currentStatus as any} />
          </div>

          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-slate-600">정산 금액</span>
            </div>
            <span className="font-black text-primary text-lg">₩{totalAmount.toLocaleString()}</span>
          </div>
          
          {request.currentStatus === '납품완료' && (
            <Card className="bg-primary/5 border-primary/20 rounded-2xl p-5 border-2 border-dashed space-y-4">
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-primary">세탁물이 병원에 도착했습니다!</p>
                  <p className="text-xs text-slate-600">수량을 확인하고 확인 버튼을 눌러주세요.</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> 서비스 피드백 (선택)
                </label>
                <Textarea 
                  placeholder="세탁 상태나 배송 서비스에 대한 의견을 남겨주세요."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-white rounded-xl border-slate-200 text-xs min-h-[80px]"
                />
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20">최종 납품 확인</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl mx-4 max-w-[calc(100vw-32px)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black">납품을 최종 확인하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm leading-relaxed">
                      확인 버튼을 누르면 해당 요청이 '병원확인완료' 상태로 변경되며, 이후 데이터 수정이 불가능합니다. 정산 절차로 진행하시겠습니까?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row gap-2">
                    <AlertDialogCancel className="flex-1 rounded-xl font-bold mt-0">취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleFinalConfirm} className="flex-1 bg-primary text-white rounded-xl font-black">네, 확인했습니다</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> 정산 상세 정보
          </h3>
          <div className="space-y-3">
            {items?.map((item) => {
              const master = masterItems?.find(m => m.id === item.laundryItemId);
              const price = master?.pricePerUnit || 0;
              const qty = item.deliveredQuantity || item.verifiedQuantity || item.requestedQuantity || 0;
              
              return (
                <Card key={item.id} className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <p className="font-black text-slate-900 text-lg">{item.itemName}</p>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">단가: ₩{price.toLocaleString()}</p>
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-none">최종: {qty}</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">정산 소계</span>
                      <span className="font-black text-slate-900">₩{(price * qty).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <div className="p-6 bg-slate-900 rounded-3xl text-white flex justify-between items-center shadow-xl">
              <span className="font-bold">최종 정산 합계</span>
              <span className="text-2xl font-black text-primary-foreground">₩{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
            <History className="h-4 w-4" /> 실시간 타임라인
          </h3>
          <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
              <div className="relative">
                <div className="absolute -left-[33px] top-1 h-5 w-5 rounded-full bg-primary border-4 border-white shadow-sm z-10"></div>
                <div>
                  <p className="text-sm font-black text-slate-900">{request.currentStatus}</p>
                  <p className="text-xs text-muted-foreground">{new Date(request.updatedAt || request.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="relative opacity-40">
                <div className="absolute -left-[33px] top-1 h-5 w-5 rounded-full bg-slate-200 border-4 border-white z-10"></div>
                <div>
                  <p className="text-sm font-bold text-slate-700">요청 생성 및 제출</p>
                  <p className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t flex gap-3 z-30 max-w-lg mx-auto">
        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-slate-200" onClick={() => router.push('/hospital/requests')}>
          목록으로
        </Button>
        <Button className="flex-1 h-14 rounded-2xl font-bold bg-slate-900 text-white shadow-xl" onClick={() => window.print()}>
          영수증 출력
        </Button>
      </div>
    </div>
  );
}
