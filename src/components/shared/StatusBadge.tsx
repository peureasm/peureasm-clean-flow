import { Badge } from '@/components/ui/badge';
import { LaundryStatus } from '@/app/lib/types';

interface StatusBadgeProps {
  status: LaundryStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getColors = (status: LaundryStatus) => {
    switch (status) {
      case '임시저장': return 'bg-slate-100 text-slate-500 border-slate-200';
      case '제출': return 'bg-primary/5 text-primary border-primary/10';
      case '수거완료': return 'bg-primary/10 text-primary border-primary/20';
      case '공장입고': return 'bg-accent text-secondary border-secondary/10';
      case '세탁중': 
      case '건조중': 
      case '포장완료': return 'bg-primary text-white border-transparent';
      case '출고': return 'bg-accent text-secondary border-secondary/20 font-black';
      case '납품완료': 
      case '병원확인완료': return 'bg-primary text-white border-transparent';
      case '종결': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <Badge variant="outline" className={`${getColors(status)} px-3 py-1 rounded-full font-bold text-[11px] border tracking-tight transition-all uppercase`}>
      {status}
    </Badge>
  );
}
