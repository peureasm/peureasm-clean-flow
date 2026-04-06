"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  Truck,
  Mail,
  Calendar,
  Hospital,
  ArrowRight,
  Share2,
  Copy,
  User,
  Package,
  Loader2,
  ClipboardList,
  CheckCircle2,
  ShieldCheck,
  MailCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import { postAuthenticatedJson } from '@/lib/authenticated-api';

export default function DriverDetailPage() {
  type DriverTabKey = 'hospitals' | 'requests';
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<DriverTabKey>('hospitals');

  const driverRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'users', id);
  }, [firestore, id]);
  const { data: driver, isLoading: isDriverLoading } = useDoc(driverRef);

  const hospitalsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'hospitals'), where('assignedDriverId', '==', id));
  }, [firestore, id]);
  const { data: assignedHospitals, isLoading: isHospitalsLoading } = useCollection(hospitalsQuery);

  const assignedHospitalIds = useMemo(() => assignedHospitals?.map((hospital) => hospital.id) || [], [assignedHospitals]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || assignedHospitalIds.length === 0) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', 'in', assignedHospitalIds.slice(0, 10)),
      limit(20)
    );
  }, [firestore, assignedHospitalIds]);
  const { data: requests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

  const recentRequestCount = requests?.length || 0;
  const assignedHospitalCount = assignedHospitals?.length || 0;
  const activeRequestCount = (requests || []).filter(
    (request) => request.currentStatus && !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(request.currentStatus)
  ).length;
  const latestRequest = (requests || [])[0] || null;
  const latestAssignedHospital = (assignedHospitals || [])[0] || null;
  const hasOperationalAccount = driver?.role === 'DRIVER';
  const hasInviteReadyEmail = Boolean(driver?.username);

  const tabMeta: Record<DriverTabKey, { title: string; description: string }> = {
    hospitals: {
      title: '담당 병원 현황',
      description: '이 기사가 실제로 맡고 있는 병원과 담당 범위를 한눈에 확인합니다.',
    },
    requests: {
      title: '최근 요청 이력',
      description: '담당 병원에서 최근 발생한 요청을 기준으로 기사 활동 흐름을 확인합니다.',
    },
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '미등록';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '미등록' : date.toLocaleDateString();
  };

  useEffect(() => {
    if (!isShareOpen || inviteLink) return;

    void (async () => {
      try {
        setIsGeneratingInvite(true);
        const response = await postAuthenticatedJson<{ inviteUrl: string }>(
          auth,
          '/api/invitations/create',
          {
            role: 'DRIVER',
            targetUserId: id,
          }
        );
        setInviteLink(response.inviteUrl);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: '초대 링크 생성 실패',
          description: error instanceof Error ? error.message : '초대 링크를 만들 수 없습니다.',
        });
      } finally {
        setIsGeneratingInvite(false);
      }
    })();
  }, [isShareOpen, inviteLink, auth, toast]);

  const handleCopyLink = async () => {
    try {
      setIsGeneratingInvite(true);
      const link =
        inviteLink ||
        (
          await postAuthenticatedJson<{ inviteUrl: string }>(
            auth,
            '/api/invitations/create',
            {
              role: 'DRIVER',
              targetUserId: id,
            }
          )
        ).inviteUrl;
      setInviteLink(link);
      await navigator.clipboard.writeText(link);
      toast({
        title: '기사 초대 링크 복사',
        description: '기사 계정 생성을 위한 초대 링크를 복사했습니다.',
      });
      setIsShareOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '초대 링크 생성 실패',
        description: error instanceof Error ? error.message : '초대 링크를 만들 수 없습니다.',
      });
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  if (isDriverLoading) {
    return <div className="p-12 text-center text-slate-400 font-bold">기사 정보를 불러오는 중...</div>;
  }

  if (!driver) {
    return <div className="p-12 text-center text-slate-400 font-bold">기사 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{driver.name}</h1>
            <p className="text-sm text-muted-foreground">ID: {driver.id}</p>
            <p className="text-sm text-slate-500 mt-1">
              기사 프로필, 병원 배정 범위, 최근 요청 흐름을 이 화면에서 함께 관리합니다.
            </p>
          </div>
        </div>
        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-xl gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 h-12">
              <Share2 className="h-4 w-4" /> 기사 초대 링크
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>기사 초대</DialogTitle>
              <DialogDescription>
                이 링크는 기사 계정을 승인 대기 상태로 등록하는 보안 링크입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                <Input
                  value={inviteLink}
                  readOnly
                  placeholder={isGeneratingInvite ? '링크 생성 중...' : '초대 링크를 준비 중입니다.'}
                  className="bg-transparent border-none text-xs text-slate-500 focus-visible:ring-0 h-auto p-0"
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={handleCopyLink} disabled={isGeneratingInvite}>
                  {isGeneratingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCopyLink} disabled={isGeneratingInvite} className="w-full rounded-xl h-12 font-bold bg-emerald-600 text-white">
                링크 복사
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Hospital className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">담당 병원</p>
              <p className="text-2xl font-black text-slate-900">{assignedHospitalCount}</p>
              <p className="text-xs text-slate-500">현재 배정된 병원 수</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">최근 요청</p>
              <p className="text-2xl font-black text-slate-900">{recentRequestCount}</p>
              <p className="text-xs text-slate-500">표시 중인 최신 요청 수</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">진행 중 요청</p>
              <p className="text-2xl font-black text-slate-900">{activeRequestCount}</p>
              <p className="text-xs text-slate-500">완료 전 단계 요청</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">계정 상태</p>
              <p className="text-lg font-black text-slate-900">
                {hasOperationalAccount ? '운영 가능' : '승인 대기'}
              </p>
              <p className="text-xs text-slate-500">
                {hasInviteReadyEmail ? '초대 대상 이메일 확인됨' : '이메일 확인 필요'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase">이메일</p>
                    <p className="text-sm font-medium">{driver.username || '미등록'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">권한 상태</p>
                    <p className="text-sm font-bold text-slate-900">
                      {hasOperationalAccount ? '기사 권한 부여됨' : '승인 또는 권한 확인 필요'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hospital className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">대표 담당 병원</p>
                    <p className="text-sm font-bold text-emerald-600">
                      {latestAssignedHospital?.name || '배정된 병원 없음'}
                    </p>
                    {latestAssignedHospital?.address ? (
                      <p className="text-xs text-slate-500 mt-1">{latestAssignedHospital.address}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">등록일</p>
                    <p className="text-sm font-medium">{formatDate(driver.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm font-black text-slate-900">운영 체크포인트</p>
                <p className="text-xs text-slate-500 mt-1">배정과 계정 상태를 빠르게 확인할 수 있습니다.</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">계정 준비 상태</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {hasInviteReadyEmail ? '초대 링크 발송 가능' : '이메일 정보 보완 필요'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {hasOperationalAccount ? '운영 권한이 활성화되어 있습니다.' : '권한 승인 여부를 확인해 주세요.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">병원 배정 상태</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {assignedHospitalCount > 0 ? `${assignedHospitalCount}곳 배정 중` : '병원 배정 필요'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">최근 활동 상태</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {latestRequest ? `${latestRequest.hospitalName || '담당 병원'} 요청 이력 있음` : '최근 요청 이력 없음'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {latestRequest ? `최근 요청일 ${latestRequest.requestDate || '미확인'}` : '새 병원 배정 후 활동 여부를 확인해 주세요.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DriverTabKey)} className="w-full">
            <div className="px-6 pt-4 border-b">
              <TabsList className="bg-transparent h-12 gap-6 flex overflow-x-auto no-scrollbar">
                <TabsTrigger value="hospitals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 font-bold whitespace-nowrap">
                  <Hospital className="h-4 w-4 mr-2" /> 담당 병원
                  <Badge variant="outline" className="ml-2 rounded-full">{assignedHospitalCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="requests" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 font-bold whitespace-nowrap">
                  <Package className="h-4 w-4 mr-2" /> 요청 이력
                  <Badge variant="outline" className="ml-2 rounded-full">{recentRequestCount}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 py-4 bg-slate-50/70 border-b">
              <p className="text-sm font-black text-slate-900">{tabMeta[activeTab].title}</p>
              <p className="text-xs text-slate-500 mt-1">{tabMeta[activeTab].description}</p>
            </div>

            <TabsContent value="hospitals" className="m-0">
              <div className="p-6 bg-slate-50/50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-700">담당 병원 배정 현황</h3>
                  <p className="text-xs text-muted-foreground">
                    현재 기사에게 연결된 병원과 현장 이동 범위를 확인합니다.
                  </p>
                </div>
                <Badge className="rounded-xl bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1.5">
                  {assignedHospitalCount > 0 ? `${assignedHospitalCount}곳 운영 중` : '배정 대기'}
                </Badge>
              </div>
              {isHospitalsLoading ? (
                <div className="p-12 text-center text-slate-300 italic">병원 목록을 불러오는 중...</div>
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
                    {assignedHospitals.map((hospital) => (
                      <TableRow key={hospital.id}>
                        <TableCell className="text-sm font-bold">{hospital.name}</TableCell>
                        <TableCell className="text-xs text-slate-500">{hospital.address}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild className="rounded-full">
                            <Link href={`/admin/hospitals/${hospital.id}`}>
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
            </TabsContent>

            <TabsContent value="requests" className="m-0">
              <div className="p-6 bg-slate-50/50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-700">기사 기준 요청 이력</h3>
                  <p className="text-xs text-muted-foreground">
                    담당 병원에서 발생한 요청을 기준으로 최근 활동량과 진행 상황을 확인합니다.
                  </p>
                </div>
                <Badge className="rounded-xl bg-sky-50 text-sky-700 border-sky-100 px-3 py-1.5">
                  진행 중 {activeRequestCount}건
                </Badge>
              </div>
              {isRequestsLoading ? (
                <div className="p-12 text-center text-slate-300 italic">요청 이력을 불러오는 중...</div>
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
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="text-sm font-medium">{request.hospitalName}</TableCell>
                        <TableCell className="text-sm">{request.requestDate}</TableCell>
                        <TableCell><StatusBadge status={request.currentStatus} /></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild className="rounded-full">
                            <Link href={`/admin/requests/${request.id}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-20 text-center text-slate-300 italic">최근 요청 이력이 없습니다.</div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
