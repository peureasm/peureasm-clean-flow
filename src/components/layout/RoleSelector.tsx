
"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/app/lib/types';
import { Hospital, Truck, Factory, ShieldCheck } from 'lucide-react';

export default function RoleSelector() {
  const router = useRouter();
  const pathname = usePathname();

  const roles: { id: UserRole; label: string; icon: any; color: string }[] = [
    { id: 'HOSPITAL', label: '병원담당자', icon: Hospital, color: 'text-blue-600' },
    { id: 'DRIVER', label: '수거기사', icon: Truck, color: 'text-emerald-600' },
    { id: 'FACTORY', label: '공장관리', icon: Factory, color: 'text-purple-600' },
    { id: 'ADMIN', label: '총괄관리자', icon: ShieldCheck, color: 'text-slate-800' },
  ];

  const currentRole = pathname.split('/')[1]?.toUpperCase() as UserRole;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-wrap gap-2 p-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50">
      <div className="w-full text-[10px] font-bold text-muted-foreground px-2 mb-1 uppercase tracking-tighter">역할 전환 (프로토타입 전용)</div>
      {roles.map((role) => (
        <Button
          key={role.id}
          variant={currentRole === role.id ? 'default' : 'outline'}
          size="sm"
          className="rounded-xl h-10 px-3 flex gap-2"
          onClick={() => router.push(`/${role.id.toLowerCase()}`)}
        >
          <role.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{role.label}</span>
        </Button>
      ))}
    </div>
  );
}
