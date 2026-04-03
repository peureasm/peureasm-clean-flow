
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from '@/components/shared/StatusBadge';
import { 
  ChevronLeft, Hospital, MapPin, User as UserIcon, 
  Calendar, ClipboardList, ArrowRight, UserPlus, ShieldCheck, Truck, Check, Share2, Copy, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function HospitalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // 병원 마스터 정보 조회
  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'hospitals', id as string);
  }, [firestore, id]);

  const { data: hospital, isLoading: isHospLoading } = useDoc(hospitalRef);

  // 해당 병원의 요청 내역 조회
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', '==', id),
      limit(20)
    );
  }, [firestore, id]);

  // 해당 병원 소속 담당자 조회
  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'users'),
      where('hospitalId', '==', id)
    );
  }, [firestore, id]);

  // 전체 기사 목록 조회 (배정용)
  const driversQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'DRIVER')
    );
  }, [firestore]);

  const { data: requests, isLoading: isReqLoading } = useCollection(requestsQuery);
  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery);
  const { data: drivers, isLoading: isDriversLoading } = useCollection(driversQuery);

  const handleAddStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !id) return;

    const formData = new FormData(e.currentTarget);
    const email = formData.get('staffEmail') as string;
    const name = formData.get('staffName') as string;
    
    const tempUid = `hospital_staff_${Math.random().toString(36).slice(2, 9)}`;
    const userRef = doc(firestore, 'users', tempUid);

    setDocumentNonBlocking(userRef, {
      id: tempUid,
      name: name,
      username: email,
      role: 'HOSPITAL',
      hospitalId: id as string,
      isActive: true,
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "담당자 프로필 생성",
      description: `${name} 담당자의 정보가 등록되었습니다.`,
    });
    setIsAddStaffOpen(false);
  };

  const handleAssignDriver = (driver: any) => {
    if (!firestore || !id || !hospitalRef) return;

    updateDocumentNonBlocking(hospitalRef, {
      assignedDriverId: driver.id,
      assignedDriverName: driver.name,
      updatedAt: new Date().toISOString()
    });

    toast({
      title: hospital?.assignedDriverId ? "전담 기사 변경 완료" : "전담 기사 매칭 완료",
      description: `${driver.name} 기사님이 ${hospital?.name}의 담당자로 지정되었습니다.`,
    });
  };

  const handleUnassignDriver = () => {
    if (!firestore || !id || !hospitalRef) return;

    updateDocumentNonBlocking(hospitalRef, {
      assignedDriverId: null,
      assignedDriverName: null,
      updatedAt: new Date().toISOString()
    });

    toast({
      title: "배정 해제 완료",
      description: "해당 병원의 전담 기사 배정이 취소되었습니다.",
    });
  };

  const getInviteLink = () => {
    if (typeof window === 'undefined' || !hospital) return '';
    return `${window.location.origin}/hospital?inviteId=${id}&name=${encodeURIComponent(hospital.name || '')}`;
  };

  const handleCopyLink = () => {
    const link = getInviteLink();
    navigator.clipboard.writeText(link);
    toast({
      title: "병원 초대 링크 복사",
      description: "담당자에게 전달할 고유 접속 URL이 복사되었습니다.",
    });
    setIsShareOpen(false);
  };

  if (isHospLoading) return <div className="p-12 text-center text-slate-400 font-bold">병원 정보를 불러오는 중...</div>;
  if (!hospital) return <div className="p-12 text-center text-slate-400 font-bold">병원 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{hospital.name}</h1>
            <p className="text-sm text-muted-foreground uppercase font-mono">Hospital Code: {hospital.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2 border-primary text-primary hover:bg-primary/5 h-12 flex-1 md:flex-none">
                <Share2 className="h-4 w-4" /> 초대 링크 공유
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>병원 담당자 초대 링크</DialogTitle>
                <DialogDescription>
                  이 링크로 접속하면 자동으로 {hospital.name}의 담당자 권한을 획득합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                  <Input value={getInviteLink()} readOnly className="bg-transparent border-none text-xs text-slate-500 focus-visible:ring-0 h-auto p-0" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCopyLink} className="w-full rounded-xl h-12 font-bold bg-primary text-white">링크 복사하기</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2 bg-slate-900 h-12 flex-1 md:flex-none">
                <UserPlus className="h-4 w-4" /> 담당자 수동 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <form onSubmit={handleAddStaff}>
                <DialogHeader>
                  <DialogTitle>병원 담당자 수동 등록</DialogTitle>
                  <DialogDescription>
                    병원 담당자의 정보를 미리 입력합니다. 초대 링크 공유를 통한 자동 가입을 권장합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-400">성함</Label>
                    <Input name="staffName" placeholder="예: 김철수" required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-400">이메일/ID</Label>
                    <Input name="staffEmail" type="email" placeholder="staff@example.com" required className="rounded-xl" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full rounded-xl h-12 font-bold">프로필 저장</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden h-fit">
          <CardHeader className="bg-primary/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary text-white rounded-2xl">
                <Hospital className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">마스터 정보</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">주소</p>
                  <p className="text-sm font-medium">{hospital.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">전담 수거 기사</p>
                  <p className="text-sm font-bold text-primary">{hospital.assignedDriverName || '미배정'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">등록일</p>
                  <p className="text-sm font-medium">{hospital.registrationDate ? new Date(hospital.registrationDate).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <Tabs defaultValue="requests" className="w-full">
            <div className="px-6 pt-4 border-b">
              <TabsList className="bg-transparent h-12 gap-6 flex overflow-x-auto no-scrollbar">
                <TabsTrigger value="requests" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-bold whitespace-nowrap">
                  <ClipboardList className="h-4 w-4 mr-2" /> 공정 이력
                </TabsTrigger>
                <TabsTrigger value="staff" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-bold whitespace-nowrap">
                  <ShieldCheck className="h-4 w-4 mr-2" /> 계정 현황
                </TabsTrigger>
                <TabsTrigger value="drivers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary font-bold whitespace-nowrap">
                  <Truck className="h-4 w-4 mr-2" /> 기사 매칭
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="requests" className="m-0">
              <div className="p-0">
                {isReqLoading ? (
                  <div className="p-12 text-center text-slate-300 italic">데이터 로딩 중...</div>
                ) : requests && requests.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase">요청일</TableHead>
                        <TableHead className="font-bold text-xs uppercase">상태</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase">상세</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="text-sm font-medium">{req.requestDate}</TableCell>
                          <TableCell><StatusBadge status={req.currentStatus as any} /></TableCell>
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
                  <div className="p-20 text-center text-slate-300 italic">진행된 공정이 없습니다.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="staff" className="m-0">
              <div className="p-0">
                {isStaffLoading ? (
                  <div className="p-12 text-center text-slate-300">사용자 조회 중...</div>
                ) : staff && staff.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase">성함</TableHead>
                        <TableHead className="font-bold text-xs uppercase">아이디</TableHead>
                        <TableHead className="text-right font-bold text-xs">상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-bold">{member.name}</TableCell>
                          <TableCell className="text-slate-500 text-xs">{member.username}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]">ACTIVE</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-20 text-center text-slate-300">등록된 병원 담당자가 없습니다. 초대 링크를 공유하세요.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="drivers" className="m-0">
              <div className="p-0">
                <div className="p-6 bg-slate-50/50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">전담 수거 기사 지정 및 변경</h3>
                    <p className="text-xs text-muted-foreground">이 병원의 세탁물 수거를 전담할 기사님을 선택하여 매칭하거나 변경합니다.</p>
                  </div>
                  {hospital.assignedDriverId && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive font-bold hover:bg-destructive/5 gap-2"
                      onClick={handleUnassignDriver}
                    >
                      <XCircle className="h-4 w-4" /> 배정 해제
                    </Button>
                  )}
                </div>
                {isDriversLoading ? (
                  <div className="p-12 text-center text-slate-300">기사 목록 조회 중...</div>
                ) : drivers && drivers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase">기사명</TableHead>
                        <TableHead className="font-bold text-xs uppercase hidden sm:table-cell">계정/ID</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase">배정 상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow key={driver.id} className="group transition-colors hover:bg-slate-50/50">
                          <TableCell className="font-bold">{driver.name}</TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono hidden sm:table-cell">{driver.username || driver.id}</TableCell>
                          <TableCell className="text-right">
                            {hospital.assignedDriverId === driver.id ? (
                              <Badge className="bg-primary text-white gap-1 px-3 py-1.5 rounded-xl border-none font-bold">
                                <Check className="h-3 w-3" /> 현재 담당자
                              </Badge>
                            ) : (
                              <Button 
                                variant={hospital.assignedDriverId ? "outline" : "default"} 
                                size="sm" 
                                className="rounded-xl font-bold h-9 transition-all" 
                                onClick={() => handleAssignDriver(driver)}
                              >
                                {hospital.assignedDriverId ? "이 기사로 변경" : "담당 기사로 지정"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-20 text-center text-slate-300">
                    시스템에 등록된 기사가 없습니다. <br/>
                    <Link href="/admin/drivers" className="text-primary font-bold underline">기사 관리</Link>에서 기사를 먼저 등록하세요.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
