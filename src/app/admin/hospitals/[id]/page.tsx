
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from '@/components/shared/StatusBadge';
import { 
  ChevronLeft, Hospital, MapPin, Phone, User as UserIcon, 
  Calendar, ClipboardList, ArrowRight, UserPlus, ShieldCheck, Mail, Truck, Check
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

  // 병원 마스터 정보 조회
  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'hospitals', id as string);
  }, [firestore, id]);

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

  const { data: hospital, isLoading: isHospLoading } = useDoc(hospitalRef);
  const { data: requests, isLoading: isReqLoading } = useCollection(requestsQuery);
  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery);
  const { data: drivers, isLoading: isDriversLoading } = useCollection(driversQuery);

  const handleAddStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !id) return;

    const formData = new FormData(e.currentTarget);
    const staffData = {
      name: formData.get('staffName') as string,
      username: formData.get('staffEmail') as string,
      role: 'HOSPITAL',
      hospitalId: id as string,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const usersRef = collection(firestore, 'users');
    addDocumentNonBlocking(usersRef, staffData);

    toast({
      title: "담당자 등록 완료",
      description: `${staffData.name} 담당자가 이 병원에 배정되었습니다.`,
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
      title: "기사 배정 완료",
      description: `${driver.name} 기사님이 이 병원의 전담 기사로 배정되었습니다.`,
    });
  };

  if (isHospLoading) return <div className="p-12 text-center text-slate-400 font-bold">병원 정보를 불러오는 중...</div>;
  if (!hospital) return <div className="p-12 text-center text-slate-400 font-bold">병원 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{hospital.name}</h1>
            <p className="text-sm text-muted-foreground">병원 코드: {hospital.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2 bg-primary">
                <UserPlus className="h-4 w-4" /> 담당자 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <form onSubmit={handleAddStaff}>
                <DialogHeader>
                  <DialogTitle>병원 담당자 등록</DialogTitle>
                  <DialogDescription>
                    {hospital.name} 소속으로 활동할 담당자 정보를 입력하세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-400">성함</Label>
                    <Input name="staffName" placeholder="예: 김철수" required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-400">이메일/ID</Label>
                    <Input name="staffEmail" type="email" placeholder="email@example.com" required className="rounded-xl" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full rounded-xl h-12">담당자 정보 저장</Button>
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase">배정 기사</p>
                  <p className="text-sm font-bold text-primary">{hospital.assignedDriverName || '미배정'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">대표 담당자</p>
                  <p className="text-sm font-medium">{hospital.contactPersonName || '정보 없음'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">등록일</p>
                  <p className="text-sm font-medium">{new Date(hospital.registrationDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <Tabs defaultValue="requests" className="w-full">
            <div className="px-6 pt-4 border-b">
              <TabsList className="bg-transparent h-12 gap-6">
                <TabsTrigger 
                  value="requests" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-primary"
                >
                  <ClipboardList className="h-4 w-4 mr-2" /> 요청 내역
                </TabsTrigger>
                <TabsTrigger 
                  value="staff" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-primary"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" /> 담당자 관리
                </TabsTrigger>
                <TabsTrigger 
                  value="drivers" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-primary"
                >
                  <Truck className="h-4 w-4 mr-2" /> 기사 배정
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="requests" className="m-0">
              <div className="p-0">
                {isReqLoading ? (
                  <div className="p-12 text-center text-slate-300 italic">내역 로딩 중...</div>
                ) : requests && requests.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase">요청일</TableHead>
                        <TableHead className="font-bold text-xs uppercase">상태</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((req) => (
                        <TableRow key={req.id} className="hover:bg-slate-50/30 transition-colors">
                          <TableCell className="text-sm font-medium">{req.requestDate}</TableCell>
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
                  <div className="p-20 text-center text-slate-300 italic">요청 내역이 없습니다.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="staff" className="m-0">
              <div className="p-0">
                {isStaffLoading ? (
                  <div className="p-12 text-center text-slate-300 italic">담당자 로딩 중...</div>
                ) : staff && staff.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase">이름</TableHead>
                        <TableHead className="font-bold text-xs uppercase">아이디</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase">상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-bold">{member.name}</TableCell>
                          <TableCell className="text-slate-500 text-xs">{member.username}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                              Active
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-20 text-center text-slate-300 italic">등록된 담당자가 없습니다.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="drivers" className="m-0">
              <div className="p-0">
                <div className="p-6 bg-slate-50/50 border-b">
                  <h3 className="text-sm font-bold text-slate-700">전담 기사 선택</h3>
                  <p className="text-xs text-muted-foreground">이 병원의 세탁물 수거 및 납품을 담당할 기사를 배정하세요.</p>
                </div>
                {isDriversLoading ? (
                  <div className="p-12 text-center text-slate-300 italic">기사 목록 로딩 중...</div>
                ) : drivers && drivers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">기사명</TableHead>
                        <TableHead className="font-bold">계정</TableHead>
                        <TableHead className="text-right font-bold">배정 상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow key={driver.id} className="group">
                          <TableCell className="font-bold">{driver.name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{driver.username}</TableCell>
                          <TableCell className="text-right">
                            {hospital.assignedDriverId === driver.id ? (
                              <Badge className="bg-primary text-white gap-1 px-3 py-1">
                                <Check className="h-3 w-3" /> 배정됨
                              </Badge>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleAssignDriver(driver)}
                              >
                                배정하기
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-20 text-center text-slate-300 italic">시스템에 등록된 기사가 없습니다.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
