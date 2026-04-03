
"use client"

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Search, Plus, ListIcon, MoreVertical, Pencil, Trash2, Loader2, DollarSign, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminItemsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const itemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'laundryItems'), orderBy('name'));
  }, [firestore]);

  const { data: items, isLoading } = useCollection(itemsQuery);

  const filteredItems = items?.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setTimeout(() => {
      setEditingItem(item);
      setIsDialogOpen(true);
    }, 100);
  };

  const handleOpenDelete = (item: any) => {
    setTimeout(() => {
      setDeletingItem(item);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const unit = formData.get('unit') as string;
    const pricePerUnit = Number(formData.get('pricePerUnit'));

    const itemData = {
      name,
      unit,
      pricePerUnit,
      isActive: true,
      updatedAt: new Date().toISOString()
    };

    if (editingItem) {
      updateDocumentNonBlocking(doc(firestore, 'laundryItems', editingItem.id), itemData);
      toast({ title: "품목 수정", description: `[${name}] 품목 정보가 수정되었습니다.` });
    } else {
      addDocumentNonBlocking(collection(firestore, 'laundryItems'), {
        ...itemData,
        createdAt: new Date().toISOString()
      });
      toast({ title: "품목 추가", description: `[${name}] 품목이 마스터에 등록되었습니다.` });
    }

    setIsSubmitting(false);
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (!firestore || !deletingItem) return;
    deleteDocumentNonBlocking(doc(firestore, 'laundryItems', deletingItem.id));
    toast({ title: "품목 삭제", description: "세탁 품목이 마스터에서 제거되었습니다." });
    setDeletingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">품목 마스터 관리</h1>
          <p className="text-muted-foreground font-medium text-sm">시스템 전체에서 사용되는 세탁 품목과 단가를 관리합니다.</p>
        </div>
        
        <Button onClick={handleOpenAdd} className="rounded-xl gap-2 h-12 px-6 shadow-lg shadow-primary/20">
          <Plus className="h-5 w-5" /> 신규 품목 등록
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          className="w-full pl-10 rounded-xl bg-white border-none shadow-sm h-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium" 
          placeholder="품목명으로 검색..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">품목 데이터를 불러오는 중...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase pl-8 h-12">품목명</TableHead>
                  <TableHead className="font-bold text-xs uppercase h-12">단위</TableHead>
                  <TableHead className="font-bold text-xs uppercase h-12">기본 단가</TableHead>
                  <TableHead className="font-bold text-xs uppercase h-12">상태</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase pr-8 h-12">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="pl-8 py-4 font-black text-slate-800">{item.name}</TableCell>
                    <TableCell className="py-4 font-medium text-slate-500">{item.unit}</TableCell>
                    <TableCell className="py-4 font-black text-primary">₩{item.pricePerUnit.toLocaleString()}</TableCell>
                    <TableCell className="py-4">
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-bold">활성</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-300">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="gap-2 font-bold cursor-pointer" onClick={() => handleOpenEdit(item)}>
                            <Pencil className="h-4 w-4" /> 수정
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 font-bold text-destructive cursor-pointer" onClick={() => handleOpenDelete(item)}>
                            <Trash2 className="h-4 w-4" /> 삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-24 text-center">
              <ListIcon className="h-12 w-12 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-bold">등록된 품목이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingItem ? "품목 정보 수정" : "신규 품목 등록"}</DialogTitle>
              <DialogDescription className="text-xs">
                시스템에서 관리할 세탁 품목 정보를 입력해 주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-400">품목명</Label>
                <Input id="name" name="name" defaultValue={editingItem?.name || ""} placeholder="예: 환자복(상/하)" className="rounded-xl font-bold" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-xs font-bold uppercase text-slate-400">단위</Label>
                  <Input id="unit" name="unit" defaultValue={editingItem?.unit || ""} placeholder="세트 / 매" className="rounded-xl font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit" className="text-xs font-bold uppercase text-slate-400">기본 단가 (원)</Label>
                  <Input id="pricePerUnit" name="pricePerUnit" type="number" defaultValue={editingItem?.pricePerUnit || 0} className="rounded-xl font-bold" required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full rounded-xl h-12 font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editingItem ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {editingItem ? "정보 저장하기" : "품목 마스터 등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">품목을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              [{deletingItem?.name}] 품목을 마스터에서 삭제합니다. 기존에 생성된 요청 내역에는 영향을 주지 않지만 신규 요청 시 선택할 수 없게 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-bold">네, 삭제합니다</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
