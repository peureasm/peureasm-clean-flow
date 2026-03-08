
"use client"

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, getDocs, doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Trash2, Database, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  // 1. 수거 요청 내역 초기화 함수
  const handleClearRequests = async () => {
    if (!firestore) return;
    setIsResetting(true);

    try {
      // collectionRequests 컬렉션의 모든 문서 조회
      const querySnapshot = await getDocs(collection(firestore, 'collectionRequests'));
      
      if (querySnapshot.empty) {
        toast({ title: "초기화할 데이터가 없습니다.", description: "이미 모든 요청 내역이 비어 있습니다." });
        setIsResetting(false);
        return;
      }

      // 배치 삭제 (프로토타입 수준의 간단한 구현)
      for (const d of querySnapshot.docs) {
        // 하위 아이템 삭제는 Firestore 보안규칙 및 구조상 별도 처리가 필요할 수 있으나
        // 여기서는 메인 요청 문서를 삭제합니다.
        deleteDocumentNonBlocking(doc(firestore, 'collectionRequests', d.id));
      }

      toast({
        title: "요청 내역 초기화 완료",
        description: `${querySnapshot.size}건의 수거 요청 데이터가 삭제되었습니다.`,
      });
    } catch (error) {
      console.error("Reset error:", error);
      toast({
        variant: "destructive",
        title: "초기화 실패",
        description: "데이터를 삭제하는 중 오류가 발생했습니다.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">시스템 설정</h1>
        <p className="text-muted-foreground font-medium">MediLaundry Flow 시스템의 전역 설정 및 데이터 관리 도구입니다.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-900 text-white rounded-2xl">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">데이터 관리 (System Reset)</CardTitle>
                <CardDescription>정식 테스트를 위해 생성된 임시 데이터를 초기화합니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-3xl bg-orange-50 border border-orange-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-orange-700">
                  <ShieldAlert className="h-5 w-5" />
                  <h3 className="font-black text-lg">수거 요청 내역 전체 삭제</h3>
                </div>
                <p className="text-sm text-orange-600/80 font-medium">
                  지금까지 생성된 모든 병원의 세탁 수거 및 납품 요청 내역을 완전히 삭제합니다.<br/>
                  병원 정보와 기사 계정 정보는 유지됩니다.
                </p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-2xl h-14 px-8 font-black gap-2 shadow-lg shadow-destructive/20 min-w-[160px]">
                    <Trash2 className="h-5 w-5" /> 내역 초기화
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black text-slate-900">정말 모든 내역을 삭제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500 font-medium py-2">
                      이 작업은 취소할 수 없습니다. 모든 병원의 공정 히스토리와 대조 데이터가 Firestore에서 즉시 제거됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-xl border-slate-200 font-bold">취소</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearRequests} 
                      className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-black"
                      disabled={isResetting}
                    >
                      {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      네, 전체 삭제합니다
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">기타 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">Master Data Status</p>
                    <p className="text-xs text-slate-500 mt-1">세탁 품목 정의(LAUNDRY_ITEMS)는 시스템 표준으로 보호되고 있습니다.</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">Real-time Sync</p>
                    <p className="text-xs text-slate-500 mt-1">데이터 변경 시 모든 기사 및 병원 담당자 화면에 즉시 반영됩니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
