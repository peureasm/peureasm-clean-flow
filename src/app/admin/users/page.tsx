
"use client"

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, Users, Loader2, Check, XCircle, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Pagination from '@/components/shared/Pagination';
import { UserRole } from '@/app/lib/types';
import AdminHospitalsPanel from '@/app/admin/users/panels/AdminHospitalsPanel';
import AdminDriversPanel from '@/app/admin/users/panels/AdminDriversPanel';
import { postAuthenticatedJson } from '@/lib/authenticated-api';

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'all' | 'pending'>('all');
  const [confirm, setConfirm] = useState<null | { userId: string; role: UserRole; kind: 'set' | 'approve' }>(null);
  const [isApplying, setIsApplying] = useState(false);
  const tab = useMemo<'users' | 'hospitals' | 'drivers'>(() => {
    const t = (searchParams.get('tab') || 'users').toLowerCase();
    if (t === 'hospitals') return 'hospitals';
    if (t === 'drivers') return 'drivers';
    return 'users';
  }, [searchParams]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const totalUsers = (users || []).length;
  const pendingUsers = (users || []).filter((u) => !u.role);
  const inactiveUsers = (users || []).filter((u) => u.isActive === false).length;
  const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentUsers = (users || []).filter((u) => {
    if (!u.createdAt) return false;
    const createdAt = new Date(u.createdAt);
    return !Number.isNaN(createdAt.getTime()) && createdAt.getTime() >= recentThreshold;
  }).length;
  const roleLabelMap: Record<UserRole, string> = {
    ADMIN: '관리자',
    HOSPITAL: '병원',
    DRIVER: '기사',
    FACTORY: '공장',
  };
  const getRoleLabel = (role?: UserRole | null) => (role ? roleLabelMap[role] : '승인 대기');

  const filteredUsers = (users || []).filter(user => {
    if (viewMode === 'pending' && user.role) return false;
    if (!normalizedSearch) return true;
    return (
      user.name?.toLowerCase().includes(normalizedSearch) ||
      user.username?.toLowerCase().includes(normalizedSearch) ||
      getRoleLabel(user.role as UserRole | null).toLowerCase().includes(normalizedSearch) ||
      getRoleLabel((user.roleRequested || undefined) as UserRole | undefined).toLowerCase().includes(normalizedSearch)
    );
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await postAuthenticatedJson(auth, '/api/admin/users', {
      userId,
      action: 'set-role',
      role: newRole,
    });
    toast({
      title: "권한 변경 완료",
      description: `사용자의 역할이 [${newRole}]으로 업데이트되었습니다.`,
    });
  };

  const handleApproveRequested = async (userId: string, requested: UserRole) => {
    await postAuthenticatedJson(auth, '/api/admin/users', {
      userId,
      action: 'approve',
      role: requested,
    });
    toast({
      title: "승인 완료",
      description: `요청 역할 [${requested}]로 승인했습니다.`,
    });
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    await postAuthenticatedJson(auth, '/api/admin/users', {
      userId,
      action: 'set-active',
      isActive: !currentStatus,
    });
    toast({
      title: currentStatus ? "계정 비활성화" : "계정 활성화",
      description: `사용자 계정 상태가 변경되었습니다.`,
    });
  };

  const confirmApply = async () => {
    if (!confirm) return;
    setIsApplying(true);
    try {
      if (confirm.kind === 'approve') await handleApproveRequested(confirm.userId, confirm.role);
      else await handleRoleChange(confirm.userId, confirm.role);
      setConfirm(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '권한 변경 실패',
        description: error instanceof Error ? error.message : '사용자 권한을 변경할 수 없습니다.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">사용자 및 권한 관리</h1>
        <p className="text-muted-foreground font-medium">가입자/권한, 병원 마스터, 기사 프로필을 한 화면에서 관리합니다.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={tab === 'users' ? 'default' : 'outline'}
          className="h-11 rounded-xl font-black"
          onClick={() => {
            router.replace('/admin/users?tab=users');
          }}
        >
          사용자/권한
        </Button>
        <Button
          variant={tab === 'hospitals' ? 'default' : 'outline'}
          className="h-11 rounded-xl font-black"
          onClick={() => {
            router.replace('/admin/users?tab=hospitals');
          }}
        >
          병원 관리
        </Button>
        <Button
          variant={tab === 'drivers' ? 'default' : 'outline'}
          className="h-11 rounded-xl font-black"
          onClick={() => {
            router.replace('/admin/users?tab=drivers');
          }}
        >
          기사 관리
        </Button>
      </div>

      {tab === 'hospitals' && (
        <div className="pt-2">
          <AdminHospitalsPanel />
        </div>
      )}

      {tab === 'drivers' && (
        <div className="pt-2">
          <AdminDriversPanel />
        </div>
      )}

      {tab === 'users' && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 font-bold uppercase">전체 사용자</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 font-bold uppercase">승인 대기</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingUsers.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">비활성 계정</p>
                <p className="text-2xl font-black text-red-600 mt-1">{inactiveUsers}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold uppercase">최근 7일</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{recentUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            className="w-full pl-10 rounded-xl bg-white border-none shadow-sm h-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium" 
            placeholder="이름, 이메일, 역할/요청 역할 검색..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            className="h-12 rounded-xl font-black"
            onClick={() => {
              setViewMode('all');
              setCurrentPage(1);
            }}
          >
            전체
          </Button>
          <Button
            variant={viewMode === 'pending' ? 'default' : 'outline'}
            className="h-12 rounded-xl font-black gap-2"
            onClick={() => {
              setViewMode('pending');
              setCurrentPage(1);
            }}
          >
            승인 대기
            <Badge className="bg-white/20 text-white border-white/20 font-black">{pendingUsers.length}</Badge>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">사용자 목록을 불러오는 중...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase pl-8 h-12">사용자 정보</TableHead>
                    <TableHead className="font-bold text-xs uppercase h-12">현재 역할</TableHead>
                    <TableHead className="font-bold text-xs uppercase h-12">가입일</TableHead>
                    <TableHead className="font-bold text-xs uppercase h-12">상태</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase pr-8 h-12">권한 설정</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/30 transition-colors">
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {user.name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-black text-slate-800">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {user.role ? (
                          <Badge variant="outline" className={`font-bold text-[10px] border-none px-2.5 py-1 ${
                            user.role === 'ADMIN' ? 'bg-slate-900 text-white' :
                            user.role === 'HOSPITAL' ? 'bg-blue-50 text-blue-600' :
                            user.role === 'DRIVER' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-purple-50 text-purple-600'
                          }`}>
                            {getRoleLabel(user.role as UserRole)}
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="outline" className="font-black text-[10px] border-none px-2.5 py-1 bg-amber-50 text-amber-700">
                              승인 대기
                            </Badge>
                            {user.roleRequested && (
                              <p className="text-[10px] text-slate-400 font-bold">
                                요청: {String(user.roleRequested)}
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-xs font-medium text-slate-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="py-4">
                        {user.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] gap-1 font-bold">
                            <Check className="h-3 w-3" /> 활성
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-600 border-red-100 text-[10px] gap-1 font-bold">
                            <XCircle className="h-3 w-3" /> 비활성
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          {!user.role && user.roleRequested && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl h-9 text-xs font-black gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                              onClick={() => setConfirm({ userId: user.id, role: user.roleRequested as UserRole, kind: 'approve' })}
                            >
                              <Sparkles className="h-3.5 w-3.5" /> 요청으로 승인
                            </Button>
                          )}
                          <Select 
                            value={user.role ?? ''} 
                            onValueChange={(val) => setConfirm({ userId: user.id, role: val as UserRole, kind: 'set' })}
                          >
                            <SelectTrigger className="h-9 w-[120px] rounded-xl border-slate-200 text-xs font-bold bg-white">
                              <SelectValue placeholder={user.role ? '역할' : '승인(역할)'} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">
                              <SelectItem value="ADMIN">관리자</SelectItem>
                              <SelectItem value="HOSPITAL">병원</SelectItem>
                              <SelectItem value="DRIVER">기사</SelectItem>
                              <SelectItem value="FACTORY">공장</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleStatusToggle(user.id, user.isActive)}
                            className={`rounded-xl h-9 text-xs font-bold ${user.isActive ? 'text-destructive hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          >
                            {user.isActive ? '차단' : '해제'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <Pagination 
                total={filteredUsers.length}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </>
          ) : (
            <div className="py-24 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-bold">검색된 사용자가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">권한 변경 확인</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              {confirm?.kind === 'approve'
                ? `요청 역할 [${confirm?.role}]로 승인하시겠습니까?`
                : `사용자 역할을 [${confirm?.role}]로 변경하시겠습니까?`}
              <br />
              변경 즉시 해당 사용자에게 적용됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-black">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApply}
              disabled={isApplying}
              className="rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-70"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
      )}
    </div>
  );
}
