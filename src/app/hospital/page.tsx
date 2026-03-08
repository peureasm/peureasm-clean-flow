
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Plus, Package, Clock, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function HospitalDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);

  // 1. 사용자 프로필 조회
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  // 2. 사용자의 소속 병원 정보 조회
  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !userData?.hospitalId) return null;
    return doc(firestore, 'hospitals', userData.hospitalId);
  }, [firestore, userData?.hospitalId]);

  const { data: hospital, isLoading: isHospLoading } = useDoc(hospitalRef);

  // 3. 해당 병원의 최근 요청 내역 조회
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !userData?.hospitalId) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', '==', userData.hospitalId),
      limit(10)
    );
  }, [firestore, userData?.hospitalId]);

  const { data: myRequests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

  const handleLinkTestHospital = async () => {
    if (!firestore || !user) return;
    setIsLinking(true);
    try {
      await setDoc(doc(firestore, 'users', user.uid), {
        hospitalId: 'test-hosp-id',
        role: 'HOSPITAL',
        name: user.displayName || '테스트 담당자',
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({ title: "테스트 병원 연결 완료", description: "이제 테스트 병원의 관리자로 활동합니다." });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLinking(false);
    }
  };

  const stats = {
    totalThisMonth: myRequests?.length || 0,
    pending: myRequests?.filter(r => !['종결', '병원확인완료'].includes(r.currentStatus)).length || 0
  };

  if (isUserLoading || isUserDocLoading || isHospLoading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4 bg-slate-50 min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold">병원 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!userData?.hospitalId) {
    return (
      <div className="p-8 sm:p-20 text-center flex flex-col items-center gap-8 max-w-md mx-auto min-h-screen">
        <div className="h-20 w-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">소속된 병원이 없습니다</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            관리자가 배정한 병원 정보가 없습니다.<br/>
            빠른 테스트를 위해 아래 버튼을 클릭하여 <span className="font-bold text-primary">테스트 병원</span>에 접속해 보세요.
          </p>
        </div>
        <div className="w-full space-y-3">
          <Button 
            onClick={handleLinkTestHospital} 
            disabled={isLinking}
            className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            {isLinking ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6 text-accent" />}
            테스트 병원으로 즉시 시작
          </Button>
          <Button asChild variant="ghost" className="w-full text-slate-400 font-bold">
            <Link href="/">홈으로 가기</Link>
          </Button>
        </div>
        <p className="text-[11px] text-slate-400 italic">* 관리자 화면의 '시스템 설정'에서 데모 환경을 먼저 구축해야 합니다.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-lg mx-auto sm:max-w-7xl animate-in fade-in duration-500">
      <section className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-primary/20">
            {userData?.name?.[0] || '김'}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">반갑습니다, {userData?.name || '담당자'}님</h1>
            <p className="text-sm text-muted-foreground font-medium">소속: <span className="text-primary font-bold">{hospital?.name || '병원명 확인 불가'}</span></p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.totalThisMonth}건</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">전체 요청</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.pending}건</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">진행 중</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Link href="/hospital/new">
        <Button className="w-full h-16 rounded-2xl text-lg font-bold flex gap-3 shadow-xl shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform">
          <Plus className="h-6 w-6" />
          신규 수거 요청 등록
        </Button>
      </Link>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-slate-800">최근 공정 내역</h2>
          <Link href="/hospital/requests" className="text-xs text-primary font-bold flex items-center bg-primary/5 px-3 py-1.5 rounded-full">
            전체보기 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isRequestsLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            <p className="text-xs text-muted-foreground">내역 로딩 중...</p>
          </div>
        ) : myRequests && myRequests.length > 0 ? (
          <div className="space-y-3">
            {myRequests.map((req) => (
              <Card key={req.id} className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all group bg-white">
                <CardContent className="p-0">
                  <Link href={`/hospital/requests/${req.id}`} className="block p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono text-slate-400">ID: {req.id.slice(-6)}</p>
                        <p className="font-black text-slate-800">{req.requestDate} 수거 건</p>
                      </div>
                      <StatusBadge status={req.currentStatus as any} />
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <Package className="h-12 w-12 text-slate-200 mx-auto" />
            <p className="text-slate-400 font-bold">진행 중인 요청이 없습니다.</p>
          </div>
        )}
      </section>
    </div>
  );
}
