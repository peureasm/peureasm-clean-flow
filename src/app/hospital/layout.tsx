
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import RoleSelector from '@/components/layout/RoleSelector';
import { Hospital, LayoutDashboard, ClipboardList, PlusCircle, CheckCircle } from 'lucide-react';

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-body">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6">
        <div className="flex items-center gap-2 font-bold text-primary">
          <Hospital className="h-6 w-6" />
          <span className="text-xl tracking-tight">MediLaundry <span className="text-secondary">Hosp</span></span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">김철수 담당자</p>
            <p className="text-xs text-muted-foreground">서울메디컬병원</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">김</div>
        </div>
      </header>
      <main className="pb-24 sm:pb-8">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-white px-2 sm:hidden">
        <NavItem href="/hospital" icon={LayoutDashboard} label="홈" />
        <NavItem href="/hospital/requests" icon={ClipboardList} label="내역" />
        <NavItem href="/hospital/new" icon={PlusCircle} label="요청" active />
        <NavItem href="/hospital/confirm" icon={CheckCircle} label="확인" />
      </nav>
      
      <RoleSelector />
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active = false }: any) {
  return (
    <a href={href} className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
      <Icon className="h-6 w-6" />
      <span className="text-[10px] font-medium">{label}</span>
    </a>
  );
}
