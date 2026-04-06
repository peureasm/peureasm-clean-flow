"use client"

import { useState } from 'react';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Search,
  Plus,
  ListIcon,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  CopyPlus,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Pagination from '@/components/shared/Pagination';

interface ItemDraft {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: string;
}

const ITEM_UNIT_OPTIONS = ['세트', '매', '벌', '장', '개', '박스', '봉투', '팩'] as const;

function createEmptyDraft(): ItemDraft {
  return {
    id: `draft_${Math.random().toString(36).slice(2, 9)}`,
    name: '',
    unit: '세트',
    pricePerUnit: '0',
  };
}

export default function AdminItemsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [draftItems, setDraftItems] = useState<ItemDraft[]>([createEmptyDraft()]);
  const [editForm, setEditForm] = useState({
    name: '',
    unit: '세트',
    pricePerUnit: '0',
  });

  const itemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'laundryItems'), orderBy('name'));
  }, [firestore]);

  const { data: items, isLoading } = useCollection(itemsQuery);

  const filteredItems = (items || []).filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setDraftItems([createEmptyDraft()]);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || '',
      unit: item.unit || '세트',
      pricePerUnit: String(item.pricePerUnit ?? 0),
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (item: any) => {
    setDeletingItem(item);
  };

  const handleDraftChange = (draftId: string, field: keyof Omit<ItemDraft, 'id'>, value: string) => {
    setDraftItems((current) =>
      current.map((draft) =>
        draft.id === draftId ? { ...draft, [field]: value } : draft
      )
    );
  };

  const handleAddDraftRow = () => {
    setDraftItems((current) => [...current, createEmptyDraft()]);
  };

  const handleRemoveDraftRow = (draftId: string) => {
    setDraftItems((current) => {
      if (current.length === 1) {
        return [createEmptyDraft()];
      }

      return current.filter((draft) => draft.id !== draftId);
    });
  };

  const handleDuplicateDraftRow = (draftId: string) => {
    setDraftItems((current) => {
      const target = current.find((draft) => draft.id === draftId);
      if (!target) return current;

      return [
        ...current,
        {
          ...target,
          id: `draft_${Math.random().toString(36).slice(2, 9)}`,
        },
      ];
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSubmitting(true);

    try {
      if (editingItem) {
        const payload = {
          name: editForm.name.trim(),
          unit: editForm.unit.trim(),
          pricePerUnit: Number(editForm.pricePerUnit || 0),
          isActive: true,
          updatedAt: new Date().toISOString(),
        };

        if (!payload.name || !payload.unit) {
          throw new Error('품목명과 단위를 입력해 주세요.');
        }

        updateDocumentNonBlocking(doc(firestore, 'laundryItems', editingItem.id), payload);
        toast({
          title: '품목 수정 완료',
          description: `[${payload.name}] 품목 정보를 수정했습니다.`,
        });
      } else {
        const validDrafts = draftItems
          .map((draft) => ({
            name: draft.name.trim(),
            unit: draft.unit.trim(),
            pricePerUnit: Number(draft.pricePerUnit || 0),
          }))
          .filter((draft) => draft.name && draft.unit);

        if (validDrafts.length === 0) {
          throw new Error('등록할 품목을 1개 이상 입력해 주세요.');
        }

        const now = new Date().toISOString();
        validDrafts.forEach((draft) => {
          addDocumentNonBlocking(collection(firestore, 'laundryItems'), {
            ...draft,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        });

        toast({
          title: '품목 일괄 등록 완료',
          description: `${validDrafts.length}개 품목을 한 번에 등록했습니다.`,
        });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      setDraftItems([createEmptyDraft()]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '품목 저장 실패',
        description: error instanceof Error ? error.message : '품목을 저장할 수 없습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!firestore || !deletingItem) return;

    deleteDocumentNonBlocking(doc(firestore, 'laundryItems', deletingItem.id));
    toast({
      title: '품목 삭제 완료',
      description: `[${deletingItem.name}] 품목을 삭제했습니다.`,
    });
    setDeletingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">품목 마스터 관리</h1>
          <p className="text-muted-foreground font-medium text-sm">
            시스템 전체에서 사용하는 세탁 품목과 기본 단가를 관리합니다.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="rounded-xl gap-2 h-12 px-6 shadow-lg shadow-primary/20 bg-primary text-white"
        >
          <Plus className="h-5 w-5" /> 신규 품목 등록
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          className="w-full pl-10 rounded-xl bg-white border-none shadow-sm h-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium"
          placeholder="품목명으로 검색"
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
              <p className="text-sm font-medium">품목 데이터를 불러오는 중...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <>
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase pl-8 h-12">품목명</TableHead>
                    <TableHead className="font-bold text-xs uppercase h-12">단위</TableHead>
                    <TableHead className="font-bold text-xs uppercase h-12">기본 단가</TableHead>
                    <TableHead className="font-bold text-xs uppercase h-12">상태</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase pr-8 h-12">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <TableCell className="pl-8 py-4 font-black text-slate-800">{item.name}</TableCell>
                      <TableCell className="py-4 font-medium text-slate-500">{item.unit}</TableCell>
                      <TableCell className="py-4 font-black text-primary">
                        {Number(item.pricePerUnit || 0).toLocaleString()}원
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-bold">
                          활성
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-300">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem
                              className="gap-2 font-bold cursor-pointer"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Pencil className="h-4 w-4" /> 수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 font-bold text-destructive cursor-pointer"
                              onClick={() => handleOpenDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" /> 삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                total={filteredItems.length}
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
              <ListIcon className="h-12 w-12 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-bold">등록된 품목이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[860px] rounded-3xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                {editingItem ? '품목 정보 수정' : '신규 품목 일괄 등록'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingItem
                  ? '기존 품목 정보를 수정합니다.'
                  : '여러 품목을 한 번에 입력하고 일괄 등록할 수 있습니다.'}
              </DialogDescription>
            </DialogHeader>

            {editingItem ? (
              <div className="grid gap-4 py-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-xs font-bold uppercase text-slate-400">
                    품목명
                  </Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))}
                    placeholder="예: 환자복(상/하)"
                    className="rounded-xl font-bold"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-unit" className="text-xs font-bold uppercase text-slate-400">
                      단위
                    </Label>
                    <Select
                      value={editForm.unit}
                      onValueChange={(value) => setEditForm((current) => ({ ...current, unit: value }))}
                    >
                      <SelectTrigger id="edit-unit" className="rounded-xl font-bold">
                        <SelectValue placeholder="단위를 선택해 주세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-price" className="text-xs font-bold uppercase text-slate-400">
                      기본 단가 (원)
                    </Label>
                    <Input
                      id="edit-price"
                      type="number"
                      min="0"
                      value={editForm.pricePerUnit}
                      onChange={(e) => setEditForm((current) => ({ ...current, pricePerUnit: e.target.value }))}
                      className="rounded-xl font-bold"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-black text-slate-900">입력 행 {draftItems.length}개</p>
                    <p className="text-xs text-slate-500">빈 행은 저장 시 제외되고, 품목명과 단위가 있는 행만 등록됩니다.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl gap-2 font-bold"
                    onClick={handleAddDraftRow}
                  >
                    <Plus className="h-4 w-4" /> 입력 행 추가
                  </Button>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {draftItems.map((draft, index) => (
                    <div key={draft.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="text-sm font-black text-slate-900">품목 {index + 1}</p>
                          <p className="text-xs text-slate-400">일괄 등록 목록의 개별 품목 정보입니다.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-slate-500"
                            onClick={() => handleDuplicateDraftRow(draft.id)}
                          >
                            <CopyPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-slate-500"
                            onClick={() => handleRemoveDraftRow(draft.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[1.6fr_1fr_1fr]">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-slate-400">품목명</Label>
                          <Input
                            value={draft.name}
                            onChange={(e) => handleDraftChange(draft.id, 'name', e.target.value)}
                            placeholder="예: 환자복(상/하)"
                            className="rounded-xl font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-slate-400">단위</Label>
                          <Select
                            value={draft.unit}
                            onValueChange={(value) => handleDraftChange(draft.id, 'unit', value)}
                          >
                            <SelectTrigger className="rounded-xl font-bold">
                              <SelectValue placeholder="단위를 선택해 주세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {ITEM_UNIT_OPTIONS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-slate-400">기본 단가 (원)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={draft.pricePerUnit}
                            onChange={(e) => handleDraftChange(draft.id, 'pricePerUnit', e.target.value)}
                            className="rounded-xl font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {!editingItem && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-12 font-bold"
                  onClick={handleAddDraftRow}
                >
                  입력 행 더 추가
                </Button>
              )}
              <Button type="submit" className="rounded-xl h-12 font-bold min-w-[200px]" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : editingItem ? (
                  <Pencil className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingItem ? '품목 정보 저장' : `${draftItems.length}개 행 기준으로 등록하기`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">품목을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              [{deletingItem?.name}] 품목을 마스터에서 삭제합니다. 기존 요청 이력은 유지되지만 신규 요청에서 선택할 수 없게 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-bold"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
