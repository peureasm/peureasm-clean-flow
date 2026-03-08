
import RoleSelector from '@/components/layout/RoleSelector';
import { Truck, MapPin, ClipboardCheck, History, Hospital } from 'lucide-react';
import Link from 'next/link';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-50 font-body">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-slate-900 px-4 sm:px-6 shadow-xl">
        <Link href="/driver" className="flex items-center gap-2 font-bold text-secondary">
          <Truck className="h-6 w-6" />
          <span className="text-xl tracking-tight">MediLaundry <span className="text-white">Driver</span></span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">이민수 기사님</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">경기남부 2팀</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary font-black border border-secondary/30">이</div>
        </div>
      </header>
      <main className="pb-24 sm:pb-8 max-w-lg mx-auto bg-slate-900 min-h-[calc(100vh-64px)] shadow-2xl">
        {children}
      </main>
      
      {/* Driver Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/10 bg-slate-900/95 backdrop-blur-lg px-2 sm:hidden">
        <NavItem href="/driver" icon={MapPin} label="오늘의경로" />
        <NavItem href="/driver/hospitals" icon={Hospital} label="내 병원" />
        <NavItem href="/driver/history" icon={History} label="수거이력" />
      </nav>
      
      <RoleSelector />
    </div>
  );
}

function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 p-2 transition-colors text-slate-400 hover:text-white">
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );
}
