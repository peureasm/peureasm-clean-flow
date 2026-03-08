
"use client"

import { useState } from 'react';
import { useFirestore, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Database, ShieldAlert, CheckCircle2, Loader2, Hospital, Truck, Sparkles } from 'lucide-react';
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
  const { user } = useUser();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState<string | null>(null);

  // 데모 데이터 구축 함수
  const setupDemo = async () => {
    if (!firestore || !user) return;
    setIsResetting('demo');

    try {
      const hospId = "test-hosp-id";
      const driverId = "test-driver-id";

      // 1. 테스트 병원 생성
      await setDoc(doc(firestore, 'hospitals', hospId), {
        id: hospId,
        name: "서울 메디컬 테스트 병원",
        address: "서울시 강남구 테헤란로 123",
        contactPersonName: "테스트 담당자",
        contactPersonPhone: "010-1234-5678",
        registrationDate: new Date().toISOString(),
        assignedDriverId: driverId,
        assignedDriverName: "테스트 기사",
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 2. 테스트 기사 프로필 생성
      await setDoc(doc(firestore, 'users', driverId), {
        id: driverId,
        name: "테스트 기사",
        username: "test-driver@medilaundry.com",
        role: "DRIVER",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({
        title: "테스트 환경 구축 완료",
        description: "테스트 병원과 기사가 생성되었습니다. 이제 각 역할 화면에서 퀵 연결이 가능합니다.",
      });
    } catch (error) {
      console.error("Demo setup error:", error);
      toast({ variant: "destructive", title: "구축 실패", description: "데모 데이터를 생성하는 중 오류가 발생했습니다." });
    } finally {
      setIsResetting(null);
    }
  };

  const clearCollection = async (collectionName: string, label: string) => {
    if (!firestore) return;
    setIsResetting(collectionName);

    try {
      const querySnapshot = await getDocs(collection(firestore, collectionName));
      for (const d of querySnapshot.docs) {
        if (collectionName === 'collectionRequests') {
          const itemsSnapshot = await getDocs(collection(firestore, `collectionRequests/${d.id}/items`));
          itemsSnapshot.docs.forEach(itemDoc => {
            deleteDocumentNonBlocking(doc(firestore, `collectionRequests/${d.id}/items`, itemDoc.id));
          });
        }
        deleteDocumentNonBlocking(doc(firestore, collectionName, d.id));
      }
      toast({ title: `${label} 초기화 시작`, description: "데이터 삭제 명령을 전달했습니다." });
    } catch (error) {
      toast({ variant: "destructive", title: "초기화 실패", description: "삭제 중 오류가 발생했습니다." });
    } finally {
      setIsResetting(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">시스템 설정</h1>
        <p className="text-muted-foreground font-medium">정식 테스트 및 데이터 관리를 위한 도구입니다.</p>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader className="bg-primary/5 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary text-white rounded-2xl">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">테스트 데모 구축 (Quick Demo)</CardTitle>
              <CardDescription>정식 가입 전 워크플로우 확인을 위해 테스트용 병원과 기사를 즉시 생성합니다.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-blue-50 border border-blue-100">
            <div className="space-y-1">
              <h3 className="font-black text-lg text-blue-900">데모 환경 원클릭 구축</h3>
              <p className="text-sm text-blue-700/80">테스트 병원(강남) 및 전담 기사 프로필을 자동으로 구성합니다.</p>
            </div>
            <Button 
              onClick={setupDemo} 
              disabled={isResetting === 'demo'}
              className="rounded-2xl h-14 px-8 font-black gap-2 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
            >
              {isResetting === 'demo' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              테스트 환경 구축하기
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 text-white rounded-2xl">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">데이터 관리 (System Reset)</CardTitle>
              <CardDescription>모든 데이터를 초기화하여 깨끗한 상태로 되돌립니다.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <ResetSection 
            title="수거 요청 내역 초기화"
            description="모든 공정 및 이력을 삭제합니다. (병원/기사 계정 유지)"
            icon={<ShieldAlert className="h-5 w-5" />}
            onReset={() => clearCollection('collectionRequests', '수거 요청')}
            isLoading={isResetting === 'collectionRequests'}
            color="orange"
          />
          <ResetSection 
            title="병원 및 사용자 정보 초기화"
            description="모든 병원 마스터 정보와 사용자 프로필을 삭제합니다."
            icon={<Hospital className="h-5 w-5" />}
            onReset={async () => {
              await clearCollection('hospitals', '병원 정보');
              await clearCollection('users', '사용자 프로필');
            }}
            isLoading={isResetting === 'hospitals' || isResetting === 'users'}
            color="destructive"
          />
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
          <Button variant="outline" className="rounded-2xl h-12 px-6 font-black gap-2 border-slate-200 hover:bg-white">
            <Trash2 className="h-4 w-4" /> 내역 초기화
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 취소할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">취소</AlertDialogCancel>
            <AlertDialogAction onClick={onReset} disabled={isLoading} className="bg-destructive text-white rounded-xl font-black">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} 네, 삭제합니다
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
