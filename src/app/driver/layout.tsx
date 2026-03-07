
import RoleSelector from '@/components/layout/RoleSelector';
import { Truck, MapPin, ClipboardCheck, History } from 'lucide-react';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111827] text-white font-body">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-gray-900 px-4 sm:px-6">
        <div className="flex items-center gap-2 font-bold text-secondary">
          <Truck className="h-6 w-6" />
          <span className="text-xl tracking-tight">MediLaundry <span className="text-white">Driver</span></span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">이민수 기사님</p>
            <p className="text-xs text-gray-400">경기남부 2팀</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">이</div>
        </div>
      </header>
      <main className="pb-24 sm:pb-8 max-w-lg mx-auto bg-gray-900 min-h-[calc(100vh-64px)]">
        {children}
      </main>
      
      {/* Driver Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/10 bg-gray-900 px-2 sm:hidden">
        <NavItem href="/driver" icon={MapPin} label="오늘의경로" active />
        <NavItem href="/driver/collection" icon={ClipboardCheck} label="수거확인" />
        <NavItem href="/driver/delivery" icon={Truck} label="납품목록" />
        <NavItem href="/driver/history" icon={History} label="이력" />
      </nav>
      
      <RoleSelector />
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active = false }: any) {
  return (
    <a href={href} className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-secondary' : 'text-gray-500'}`}>
      <Icon className="h-6 w-6" />
      <span className="text-[10px] font-medium">{label}</span>
    </a>
  );
}
