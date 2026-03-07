
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import { ChevronLeft, Hospital, MapPin, Phone, User, Calendar, ClipboardList, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HospitalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();

  const hospitalRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'hospitals', id as string);
  }, [firestore, id]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'collectionRequests'),
      where('hospitalId', '==', id),
      limit(20)
    );
  }, [firestore, id]);

  const { data: hospital, isLoading: isHospLoading } = useDoc(hospitalRef);
  const { data: requests, isLoading: isReqLoading } = useCollection(requestsQuery);

  if (isHospLoading) return <div className="p-12 text-center text-slate-400 font-bold">병원 정보를 불러오는 중...</div>;
  if (!hospital) return <div className="p-12 text-center text-slate-400 font-bold">병원 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{hospital.name} 상세 정보</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="bg-primary/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary text-white rounded-2xl">
                <Hospital className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">기본 정보</CardTitle>
                <p className="text-xs text-muted-foreground">ID: {hospital.id}</p>
              </div>
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
                <User className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">담당자</p>
                  <p className="text-sm font-medium">{hospital.contactPersonName || '정보 없음'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">연락처</p>
                  <p className="text-sm font-medium">{hospital.contactPersonPhone || '정보 없음'}</p>
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
            <Button className="w-full rounded-xl bg-slate-900 h-11">병원 정보 수정</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold">최근 세탁 요청 내역</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">총 {requests?.length || 0}건</p>
          </CardHeader>
          <CardContent className="p-0">
            {isReqLoading ? (
              <div className="p-12 text-center text-slate-300 italic">내역 로딩 중...</div>
            ) : requests && requests.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">요청일</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">상태</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">특이사항</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-slate-50/30 transition-colors">
                      <TableCell className="text-sm font-medium">{req.requestDate}</TableCell>
                      <TableCell><StatusBadge status={req.currentStatus} /></TableCell>
                      <TableCell className="text-xs text-slate-500 italic max-w-[200px] truncate">
                        {req.specialNotes || '-'}
                      </TableCell>
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
              <div className="p-20 text-center text-slate-300 italic">
                해당 병원의 요청 내역이 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
