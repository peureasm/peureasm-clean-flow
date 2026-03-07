
import RoleSelector from '@/components/layout/RoleSelector';
import { Factory, Kanban, PackageCheck, Truck, List } from 'lucide-react';

export default function FactoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-8">
        <div className="flex items-center gap-2 font-bold text-purple-700">
          <Factory className="h-6 w-6" />
          <span className="text-xl tracking-tight">MediLaundry <span className="text-slate-800">Factory</span></span>
        </div>
        <div className="ml-8 hidden md:flex gap-6 items-center">
          <NavLink href="/factory" icon={Kanban} label="공정 보드" active />
          <NavLink href="/factory/inbound" icon={List} label="입고 대기" />
          <NavLink href="/factory/outbound" icon={PackageCheck} label="출고 준비" />
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">최진혁 공장장</p>
            <p className="text-xs text-muted-foreground">경기 제1세탁센터</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">최</div>
        </div>
      </header>
      <main className="p-4 sm:p-8">
        {children}
      </main>
      <RoleSelector />
    </div>
  );
}

function NavLink({ href, icon: Icon, label, active = false }: any) {
  return (
    <a href={href} className={`flex items-center gap-2 text-sm font-bold ${active ? 'text-purple-700' : 'text-slate-500 hover:text-purple-600 transition-colors'}`}>
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}
