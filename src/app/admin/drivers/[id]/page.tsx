
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, Truck, Mail, Calendar, Hospital, 
  ArrowRight, Share2, Copy, User, Package
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';

export default function DriverDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isShareOpen, setIsShareOpen] = useState(false);

  // 기사 프로필 정보 조회
  const driverRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'users', id as string);
  }, [firestore, id]);

  const { data: driver, isLoading: isDriverLoading } = useDoc(driverRef);

  // 해당 기사가 배정된 병원 목록 조회
  const hospitalsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'hospitals'),
      where('assignedDriverId', '==', id)
    );
  }, [firestore, id]);

  const { data: assignedHospitals, isLoading: isHospLoading } = useCollection(hospitalsQuery);

  // 기사의 담당 병원들의 최근 요청 조회
  const assignedHospitalIds = useMemo(() => {
    return assignedHospitals?.map(h => h.id) || [];
  }, [assignedHospitals]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || assignedHospitalIds.length === 0) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', 'in', assignedHospitalIds.slice(0, 10)),
      limit(20)
    );
  }, [firestore, assignedHospitalIds]);

  const { data: requests, isLoading: isReqLoading } = useCollection(requestsQuery);

  const getInviteLink = () => {
    if (typeof window === 'undefined' || !driver) return '';
    // 성함을 포함하여 초대 링크 생성 (UserProfileSync에서 초대 파라미터 처리)
    return `${window.location.origin}/driver?driverInvite=true&name=${encodeURIComponent(driver.name || '')}`;
  };

  const handleCopyLink = () => {
    const link = getInviteLink();
    navigator.clipboard.writeText(link);
    toast({
      title: "기사 초대 링크 복사 완료",
      description: "기사님에게 전달할 전용 접속 링크가 복사되었습니다.",
    });
    setIsShareOpen(false);
  };

  if (isDriverLoading) return <div className="p-12 text-center text-slate-400 font-bold">기사 정보를 불러오는 중...</div>;
  if (!driver) return <div className="p-12 text-center text-slate-400 font-bold">기사 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{driver.name} 기사님</h1>
            <p className="text-sm text-muted-foreground">ID: {driver.id}</p>
          </div>
        </div>
        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-xl gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
              <Share2 className="h-4 w-4" /> 기사 전용 링크 공유
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>기사 전용 초대 링크</DialogTitle>
              <DialogDescription>
                이 링크로 접속한 사용자는 자동으로 '{driver.name}' 기사님의 권한으로 등록됩니다.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                <Input value={getInviteLink()} readOnly className="bg-transparent border-none text-xs text-slate-500 focus-visible:ring-0 h-auto p-0" />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCopyLink} className="w-full rounded-xl h-12 font-bold bg-emerald-600 text-white">초대 링크 복사</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden h-fit">
          <CardHeader className="bg-emerald-50 pb-6 text-emerald-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl">
                <User className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">기사 프로필</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">계정(이메일)</p>
                  <p className="text-sm font-medium">{driver.username}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hospital className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">담당 병원 수</p>
                  <p className="text-sm font-bold text-emerald-600">{assignedHospitals?.length || 0}개 거점</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">등록일</p>
                  <p className="text-sm font-medium">{driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <Tabs defaultValue="hospitals" className="w-full">
            <div className="px-6 pt-4 border-b">
              <TabsList className="bg-transparent h-12 gap-6">
                <TabsTrigger value="hospitals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 font-bold">
                  <Hospital className="h-4 w-4 mr-2" /> 담당 병원 목록
                </TabsTrigger>
                <TabsTrigger value="requests" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 font-bold">
                  <Package className="h-4 w-4 mr-2" /> 담당 구역 요청 내역
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="hospitals" className="m-0">
              <div className="p-0">
                {isHospLoading ? (
                  <div className="p-12 text-center text-slate-300 italic">병원 목록 로딩 중...</div>
                ) : assignedHospitals && assignedHospitals.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="font-bold text-xs">병원명</TableHead>
                        <TableHead className="font-bold text-xs">주소</TableHead>
                        <TableHead className="text-right font-bold text-xs">상세</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedHospitals.map((hosp) => (
                        <TableRow key={hosp.id}>
                          <TableCell className="text-sm font-bold">{hosp.name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{hosp.address}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild className="rounded-full">
                              <Link href={`/admin/hospitals/${hosp.id}`}>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-20 text-center text-slate-300 italic">배정된 병원이 없습니다.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="m-0">
              <div className="p-0">
                {isReqLoading ? (
                  <div className="p-12 text-center text-slate-300 italic">내역 로딩 중...</div>
                ) : requests && requests.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="font-bold text-xs">병원명</TableHead>
                        <TableHead className="font-bold text-xs">요청일</TableHead>
                        <TableHead className="font-bold text-xs">상태</TableHead>
                        <TableHead className="text-right font-bold text-xs">상세</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="text-sm font-medium">{req.hospitalName}</TableCell>
                          <TableCell className="text-sm">{req.requestDate}</TableCell>
                          <TableCell><StatusBadge status={req.currentStatus} /></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild className="rounded-full">
                              <Link href={`/admin/requests/${req.id}`}>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-20 text-center text-slate-300 italic">최근 요청 내역이 없습니다.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
