
"use client"

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Search, Users, ShieldCheck, Mail, Loader2, UserCog, Check, XCircle, MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Pagination from '@/components/shared/Pagination';
import { UserRole } from '@/app/lib/types';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const filteredUsers = users?.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), {
      role: newRole,
      updatedAt: new Date().toISOString()
    });
    toast({
      title: "권한 변경 완료",
      description: `사용자의 역할이 [${newRole}]으로 업데이트되었습니다.`,
    });
  };

  const handleStatusToggle = (userId: string, currentStatus: boolean) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), {
      isActive: !currentStatus,
      updatedAt: new Date().toISOString()
    });
    toast({
      title: currentStatus ? "계정 비활성화" : "계정 활성화",
      description: `사용자 계정 상태가 변경되었습니다.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">사용자 및 권한 관리</h1>
        <p className="text-muted-foreground font-medium">시스템에 가입된 모든 사용자의 역할과 활성화 상태를 관리합니다.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          className="w-full pl-10 rounded-xl bg-white border-none shadow-sm h-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium" 
          placeholder="이름, 이메일, 역할 검색..." 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
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
                        <Badge variant="outline" className={`font-bold text-[10px] border-none px-2.5 py-1 ${
                          user.role === 'ADMIN' ? 'bg-slate-900 text-white' :
                          user.role === 'HOSPITAL' ? 'bg-blue-50 text-blue-600' :
                          user.role === 'DRIVER' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {user.role}
                        </Badge>
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
                          <Select 
                            value={user.role} 
                            onValueChange={(val) => handleRoleChange(user.id, val as UserRole)}
                          >
                            <SelectTrigger className="h-9 w-[120px] rounded-xl border-slate-200 text-xs font-bold bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                              <SelectItem value="HOSPITAL">HOSPITAL</SelectItem>
                              <SelectItem value="DRIVER">DRIVER</SelectItem>
                              <SelectItem value="FACTORY">FACTORY</SelectItem>
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
    </div>
  );
}
