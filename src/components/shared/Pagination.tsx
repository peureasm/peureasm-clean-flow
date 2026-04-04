
"use client"

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({ total, currentPage, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  
  if (total === 0) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page</p>
          <Select value={pageSize.toString()} onValueChange={(v) => onPageSizeChange(parseInt(v))}>
            <SelectTrigger className="h-9 w-[70px] rounded-xl border-slate-200 text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl font-bold">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] font-bold text-slate-400">
          Showing <span className="text-slate-900">{startIdx}-{endIdx}</span> of <span className="text-slate-900">{total}</span>
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors" 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-1 mx-2">
          <span className="text-xs font-black text-primary">{currentPage}</span>
          <span className="text-xs font-bold text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-500">{totalPages || 1}</span>
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors" 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
