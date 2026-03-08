
"use client"

import { useState } from 'react';
import { useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { collection, getDocs, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Database, ShieldAlert, CheckCircle2, Loader2, Hospital, Truck } from 'lucide-react';
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
  const [isResetting, setIsResetting] = useState<string | null>(null);

  // 데이터 삭제 통합 함수 (재귀적 삭제 및 에러 핸들링 강화)
  const clearCollection = async (collectionName: string, label: string) => {
    if (!firestore) return;
    setIsResetting(collectionName);

    try {
      const querySnapshot = await getDocs(collection(firestore, collectionName));
      
      if (querySnapshot.empty) {
        toast({ title: "초기화할 데이터가 없습니다.", description: `이미 [${label}] 내역이 비어 있습니다.` });
        setIsResetting(null);
        return;
      }

      // 개별 문서 순회하며 삭제 처리
      for (const d of querySnapshot.docs) {
        // 1. 하위 컬렉션(items) 선제적 삭제 (수거 요청인 경우)
        if (collectionName === 'collectionRequests') {
          const itemsSnapshot = await getDocs(collection(firestore, `collectionRequests/${d.id}/items`));
          itemsSnapshot.docs.forEach(itemDoc => {
            deleteDocumentNonBlocking(doc(firestore, `collectionRequests/${d.id}/items`, itemDoc.id));
          });
        }
        
        // 2. 메인 문서 삭제
        deleteDocumentNonBlocking(doc(firestore, collectionName, d.id));
      }

      toast({
        title: `${label} 초기화 시작`,
        description: `총 ${querySnapshot.size}건의 데이터에 대해 삭제 명령을 전달했습니다. 잠시 후 반영됩니다.`,
      });
    } catch (error) {
      console.error("Reset error:", error);
      toast({
        variant: "destructive",
        title: "초기화 실패",
        description: "데이터를 삭제하는 중 권한 또는 네트워크 오류가 발생했습니다.",
      });
    } finally {
      setIsResetting(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">시스템 설정</h1>
        <p className="text-muted-foreground font-medium">MediLaundry Flow 시스템의 전역 설정 및 데이터 관리 도구입니다.</p>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 text-white rounded-2xl">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">데이터 관리 (System Reset)</CardTitle>
              <CardDescription>정식 테스트 및 운영 전환을 위해 모든 데이터를 초기화할 수 있습니다.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          
          <ResetSection 
            title="수거 요청 내역 초기화"
            description="현재 진행 중인 공정과 과거 이력을 모두 삭제합니다. 병원/기사 계정은 유지됩니다."
            icon={<ShieldAlert className="h-5 w-5" />}
            onReset={() => clearCollection('collectionRequests', '수거 요청')}
            isLoading={isResetting === 'collectionRequests'}
            color="orange"
          />

          <ResetSection 
            title="병원 정보 초기화"
            description="시스템에 등록된 모든 병원 마스터 정보를 삭제합니다."
            icon={<Hospital className="h-5 w-5" />}
            onReset={() => clearCollection('hospitals', '병원 정보')}
            isLoading={isResetting === 'hospitals'}
            color="destructive"
          />

          <ResetSection 
            title="사용자/기사 프로필 초기화"
            description="등록된 모든 사용자 계정 정보를 삭제합니다. (관리자 본인은 유지 권장)"
            icon={<Truck className="h-5 w-5" />}
            onReset={() => clearCollection('users', '사용자 프로필')}
            isLoading={isResetting === 'users'}
            color="destructive"
          />

          <div className="pt-8 border-t border-slate-50">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1 mb-4">시스템 상태</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">Master Data Status</p>
                  <p className="text-xs text-slate-500 mt-1">세탁 품목 정의는 시스템 표준으로 보호됩니다.</p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">주의 사항</p>
                  <p className="text-xs text-slate-500 mt-1">데이터 삭제 후에는 절대 복구할 수 없습니다.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResetSection({ title, description, icon, onReset, isLoading, color }: any) {
  const isDestructive = color === 'destructive';
  
  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-3xl border ${isDestructive ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
      <div className="space-y-1">
        <div className={`flex items-center gap-2 ${isDestructive ? 'text-red-700' : 'text-orange-700'}`}>
          {icon}
          <h3 className="font-black text-lg">{title}</h3>
        </div>
        <p className={`text-sm font-medium ${isDestructive ? 'text-red-600/80' : 'text-orange-600/80'}`}>
          {description}
        </p>
      </div>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={isDestructive ? "destructive" : "default"} className="rounded-2xl h-12 px-6 font-black gap-2 min-w-[140px] bg-slate-900 hover:bg-slate-800 text-white border-none shadow-xl">
            <Trash2 className="h-4 w-4" /> 내역 초기화
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-900">정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium py-2">
              이 작업은 취소할 수 없습니다. 선택한 모든 데이터가 Firestore에서 즉시 제거됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200 font-bold">취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onReset} 
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-black border-none"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              네, 삭제합니다
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
