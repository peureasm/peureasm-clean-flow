"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getDocs,
  collection,
  limit,
  query,
  doc,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  Loader2,
  Receipt,
  Search,
} from 'lucide-react';
import Link from 'next/link';

import {
  updateDocumentNonBlocking,
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import Pagination from '@/components/shared/Pagination';
import StatusBadge from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

type RequestFilter = 'all' | 'active' | 'settlements' | 'closed';

type SettlementSummary = {
  itemCount: number;
  totalAmount: number;
};

const SETTLEMENT_PENDING_STATUS = '병원확인완료';
const SETTLEMENT_COMPLETED_STATUS = '종결';

function getFilterFromQuery(value: string | null): RequestFilter {
  if (value === 'active') return 'active';
  if (value === 'settlements') return 'settlements';
  if (value === 'closed') return 'closed';
  return 'all';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString();
}

function formatCurrency(value: number) {
  return `₩${value.toLocaleString()}`;
}

export default function AdminRequestsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [settlementByRequestId, setSettlementByRequestId] = useState<Record<string, SettlementSummary>>({});
  const [isSettlementLoading, setIsSettlementLoading] = useState(false);

  const selectedFilter = getFilterFromQuery(searchParams.get('view'));

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'collectionRequests'), limit(1000));
  }, [firestore, user]);

  const itemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'laundryItems');
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(requestsQuery);
  const { data: masterItems } = useCollection(itemsQuery);

  const sortedRequests = useMemo(() => {
    return [...(requests || [])].sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return rightTime - leftTime;
    });
  }, [requests]);

  const settlementTargetRequests = useMemo(
    () => sortedRequests.filter((request) => request.currentStatus === SETTLEMENT_PENDING_STATUS),
    [sortedRequests]
  );

  useEffect(() => {
    const calculateSettlements = async () => {
      if (!firestore || !masterItems || settlementTargetRequests.length === 0) {
        setSettlementByRequestId({});
        setIsSettlementLoading(false);
        return;
      }

      setIsSettlementLoading(true);

      try {
        const entries = await Promise.all(
          settlementTargetRequests.map(async (request) => {
            const itemsSnapshot = await getDocs(collection(firestore, `collectionRequests/${request.id}/items`));
            let totalAmount = 0;
            let itemCount = 0;

            itemsSnapshot.docs.forEach((snapshot) => {
              const itemData = snapshot.data();
              const master = masterItems.find((item) => item.id === itemData.laundryItemId);
              const pricePerUnit = Number(master?.pricePerUnit || 0);
              const quantity = Number(
                itemData.deliveredQuantity ?? itemData.verifiedQuantity ?? itemData.requestedQuantity ?? 0
              );

              totalAmount += pricePerUnit * quantity;
              itemCount += quantity;
            });

            return [request.id, { itemCount, totalAmount }] as const;
          })
        );

        setSettlementByRequestId(Object.fromEntries(entries));
      } finally {
        setIsSettlementLoading(false);
      }
    };

    void calculateSettlements();
  }, [firestore, masterItems, settlementTargetRequests]);

  const stats = useMemo(() => {
    const total = sortedRequests.length;
    const settlements = settlementTargetRequests.length;
    const closed = sortedRequests.filter((request) => request.currentStatus === SETTLEMENT_COMPLETED_STATUS).length;
    const active = total - settlements - closed;
    const totalPendingAmount = Object.values(settlementByRequestId).reduce(
      (sum, settlement) => sum + settlement.totalAmount,
      0
    );

    return {
      total,
      active,
      settlements,
      closed,
      totalPendingAmount,
    };
  }, [settlementByRequestId, settlementTargetRequests.length, sortedRequests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sortedRequests.filter((request) => {
      if (selectedFilter === 'active') {
        if ([SETTLEMENT_PENDING_STATUS, SETTLEMENT_COMPLETED_STATUS].includes(request.currentStatus)) {
          return false;
        }
      }

      if (selectedFilter === 'settlements' && request.currentStatus !== SETTLEMENT_PENDING_STATUS) {
        return false;
      }

      if (selectedFilter === 'closed' && request.currentStatus !== SETTLEMENT_COMPLETED_STATUS) {
        return false;
      }

      if (filterDate && request.requestDate !== filterDate) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [request.hospitalName, request.id, request.currentStatus]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [filterDate, searchTerm, selectedFilter, sortedRequests]);

  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const topSettlementTargets = settlementTargetRequests.slice(0, 3);

  const navigateToFilter = (filter: RequestFilter) => {
    setCurrentPage(1);

    if (filter === 'all') {
      router.replace('/admin/requests');
      return;
    }

    router.replace(`/admin/requests?view=${filter}`);
  };

  const handleCompleteSettlement = (requestId: string) => {
    if (!firestore) return;

    setProcessingId(requestId);
    updateDocumentNonBlocking(doc(firestore, 'collectionRequests', requestId), {
      currentStatus: SETTLEMENT_COMPLETED_STATUS,
      settledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setTimeout(() => {
      toast({
        title: '정산 완료',
        description: '해당 요청을 종결 상태로 변경했습니다.',
      });
      setProcessingId(null);
    }, 500);
  };

  const handleExportExcel = () => {
    if (filteredRequests.length === 0) {
      toast({
        variant: 'destructive',
        title: '다운로드 불가',
        description: '내보낼 요청 데이터가 없습니다.',
      });
      return;
    }

    try {
      const excelData = filteredRequests.map((request) => {
        const settlement = settlementByRequestId[request.id];

        return {
          요청ID: request.id,
          병원명: request.hospitalName,
          요청일: request.requestDate,
          현재상태: request.currentStatus,
          정산상태:
            request.currentStatus === SETTLEMENT_PENDING_STATUS
              ? '정산 대기'
              : request.currentStatus === SETTLEMENT_COMPLETED_STATUS
                ? '정산 완료'
                : '진행 중',
          정산금액: settlement?.totalAmount || 0,
          최종업데이트: formatDateTime(request.updatedAt || request.createdAt),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '요청목록');

      const suffix = selectedFilter === 'all' ? '전체' : selectedFilter;
      const fileName = `MediLaundry_요청목록_${suffix}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: '엑셀 다운로드 완료',
        description: `${fileName} 파일을 생성했습니다.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '다운로드 실패',
        description: error instanceof Error ? error.message : '엑셀 파일 생성 중 오류가 발생했습니다.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">전체 요청 내역</h1>
          <p className="text-sm font-medium text-muted-foreground">
            요청 흐름과 정산 대기 건을 한 화면에서 확인하고 종결 처리까지 이어서 관리합니다.
          </p>
        </div>
        <Button
          onClick={handleExportExcel}
          variant="secondary"
          className="h-12 gap-2 rounded-xl border-none bg-white px-6 text-secondary shadow-lg shadow-secondary/20 transition-all active:scale-95 hover:bg-slate-50"
        >
          <FileSpreadsheet className="h-5 w-5" /> 엑셀 다운로드
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="rounded-3xl border-none bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">전체 요청</p>
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">진행 중</p>
              <p className="text-2xl font-black text-slate-900">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">정산 대기</p>
              <p className="text-2xl font-black text-slate-900">{stats.settlements}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">종결 완료</p>
              <p className="text-2xl font-black text-slate-900">{stats.closed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-primary/5 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">총 정산 대기 금액</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(stats.totalPendingAmount)}</p>
            <p className="mt-1 text-xs text-slate-500">병원 최종 확인 완료 건 기준</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={selectedFilter === 'all' ? 'default' : 'outline'} className="h-11 rounded-xl font-black" onClick={() => navigateToFilter('all')}>
          전체
        </Button>
        <Button variant={selectedFilter === 'active' ? 'default' : 'outline'} className="h-11 rounded-xl font-black" onClick={() => navigateToFilter('active')}>
          진행 중
        </Button>
        <Button variant={selectedFilter === 'settlements' ? 'default' : 'outline'} className="h-11 rounded-xl gap-2 font-black" onClick={() => navigateToFilter('settlements')}>
          정산 대기
          <Badge className="border-amber-100 bg-amber-50 text-amber-700">{stats.settlements}</Badge>
        </Button>
        <Button variant={selectedFilter === 'closed' ? 'default' : 'outline'} className="h-11 rounded-xl font-black" onClick={() => navigateToFilter('closed')}>
          종결
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-sm">
          <CardHeader className="border-b bg-slate-50/30 px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <ClipboardList className="h-5 w-5 text-primary" /> 요청 목록 ({filteredRequests.length}건)
                </CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  정산 대기 요청은 이 목록에서 바로 확인하고 상세 또는 즉시 종결 처리할 수 있습니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="병원명, 요청 ID, 상태 검색"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 w-[240px] rounded-xl border-slate-200 pl-9 font-medium"
                  />
                </div>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(event) => {
                    setFilterDate(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 w-[170px] rounded-xl border-slate-200 font-medium"
                />
                {(searchTerm || filterDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterDate('');
                      setCurrentPage(1);
                    }}
                    className="text-xs text-slate-500 hover:bg-slate-100"
                  >
                    필터 초기화
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 p-20 text-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                요청 데이터를 불러오는 중입니다...
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 font-bold text-xs uppercase tracking-wider">병원 정보</TableHead>
                      <TableHead className="h-12 font-bold text-xs uppercase tracking-wider">요청일</TableHead>
                      <TableHead className="h-12 font-bold text-xs uppercase tracking-wider">상태</TableHead>
                      <TableHead className="h-12 font-bold text-xs uppercase tracking-wider">정산 현황</TableHead>
                      <TableHead className="h-12 font-bold text-xs uppercase tracking-wider">최종 업데이트</TableHead>
                      <TableHead className="h-12 pr-6 text-right font-bold text-xs uppercase tracking-wider">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.map((request) => {
                      const settlement = settlementByRequestId[request.id];
                      const isSettlementPending = request.currentStatus === SETTLEMENT_PENDING_STATUS;
                      const isSettlementDone = request.currentStatus === SETTLEMENT_COMPLETED_STATUS;

                      return (
                        <TableRow key={request.id} className="transition-colors hover:bg-slate-50/40">
                          <TableCell>
                            <div className="space-y-1 py-1">
                              <p className="font-black text-slate-800">{request.hospitalName}</p>
                              <p className="text-xs font-medium text-slate-400">ID: {request.id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{request.requestDate || '-'}</TableCell>
                          <TableCell>
                            <StatusBadge status={request.currentStatus as any} />
                          </TableCell>
                          <TableCell>
                            {isSettlementPending ? (
                              <div className="space-y-1">
                                <Badge className="border-amber-100 bg-amber-50 text-amber-700">정산 대기</Badge>
                                <p className="text-sm font-black text-slate-900">
                                  {settlement ? formatCurrency(settlement.totalAmount) : isSettlementLoading ? '계산 중...' : formatCurrency(0)}
                                </p>
                                <p className="text-[11px] text-slate-500">{settlement?.itemCount || 0}개 납품 기준</p>
                              </div>
                            ) : isSettlementDone ? (
                              <div className="space-y-1">
                                <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">정산 완료</Badge>
                                <p className="text-xs text-slate-500">종결 처리 완료</p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">미대상</Badge>
                                <p className="text-xs text-slate-500">병원 최종 확인 후 정산 가능</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-muted-foreground">
                            {formatDateTime(request.updatedAt || request.createdAt)}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex justify-end gap-2">
                              {isSettlementPending && (
                                <Button
                                  size="sm"
                                  className="h-9 rounded-xl bg-slate-900 font-bold text-white shadow-md shadow-slate-200"
                                  onClick={() => handleCompleteSettlement(request.id)}
                                  disabled={processingId === request.id}
                                >
                                  {processingId === request.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                  정산 완료
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary">
                                <Link href={`/admin/requests/${request.id}`}>
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!isLoading && filteredRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                          조건에 맞는 요청이 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <Pagination
                  total={filteredRequests.length}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden rounded-3xl border-none bg-slate-900 text-white shadow-sm">
            <CardHeader className="border-b border-white/10 bg-white/5">
              <CardTitle className="text-sm font-bold">정산 통합 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-400">정산 대상 총 건수</span>
                  <span className="font-bold">{stats.settlements}건</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-400">총 정산 대기 금액</span>
                  <span className="font-bold">{formatCurrency(stats.totalPendingAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-400">평균 건당 정산액</span>
                  <span className="font-bold">
                    {formatCurrency(stats.settlements > 0 ? Math.round(stats.totalPendingAmount / stats.settlements) : 0)}
                  </span>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 space-y-3 text-[11px] leading-relaxed text-slate-300">
                <p>병원 담당자가 최종 납품 확인을 완료한 요청만 자동으로 정산 대기 목록에 들어옵니다.</p>
                <p>정산 완료 버튼을 누르면 요청 상태가 종결로 변경되고, 요청 상세에서는 정산 이력을 계속 확인할 수 있습니다.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-sm font-bold">우선 확인할 정산 대기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              {isSettlementLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> 정산 금액을 계산 중입니다.
                </div>
              ) : topSettlementTargets.length > 0 ? (
                topSettlementTargets.map((request) => {
                  const settlement = settlementByRequestId[request.id];

                  return (
                    <div key={request.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-black text-slate-900">{request.hospitalName}</p>
                      <p className="mt-1 text-xs text-slate-500">요청일 {request.requestDate}</p>
                      <p className="mt-3 text-sm font-black text-primary">{formatCurrency(settlement?.totalAmount || 0)}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{settlement?.itemCount || 0}개 납품 기준</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm font-medium text-slate-400">현재 정산 대기 중인 요청이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
