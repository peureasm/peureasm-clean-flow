
import { Badge } from '@/components/ui/badge';
import { LaundryStatus } from '@/app/lib/types';

interface StatusBadgeProps {
  status: LaundryStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = (status: LaundryStatus) => {
    switch (status) {
      case '임시저장': return 'outline';
      case '제출': return 'secondary';
      case '수거완료': return 'default';
      case '공장입고': return 'secondary';
      case '세탁중': return 'default';
      case '건조중': return 'default';
      case '포장완료': return 'default';
      case '출고': return 'secondary';
      case '납품완료': return 'default';
      case '병원확인완료': return 'default';
      case '종결': return 'outline';
      default: return 'outline';
    }
  };

  const getColors = (status: LaundryStatus) => {
    switch (status) {
      case '임시저장': return 'bg-slate-100 text-slate-600 border-slate-200';
      case '제출': return 'bg-blue-100 text-blue-700 border-blue-200';
      case '수거완료': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case '공장입고': return 'bg-purple-100 text-purple-700 border-purple-200';
      case '세탁중': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case '건조중': return 'bg-orange-100 text-orange-700 border-orange-200';
      case '포장완료': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case '출고': return 'bg-sky-100 text-sky-700 border-sky-200';
      case '납품완료': return 'bg-teal-100 text-teal-700 border-teal-200';
      case '병원확인완료': return 'bg-emerald-600 text-white border-transparent';
      case '종결': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return '';
    }
  };

  return (
    <Badge variant="outline" className={`${getColors(status)} px-2.5 py-0.5 rounded-full font-medium border`}>
      {status}
    </Badge>
  );
}
