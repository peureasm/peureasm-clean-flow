
import RoleSelector from '@/components/layout/RoleSelector';
import { SidebarProvider, SidebarInset, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, Hospital, Settings, ClipboardList, AlertCircle, BarChart3, CreditCard, LogOut, Package, Truck } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-[#F2F5F8]">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-6">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Admin Control Center</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></div>
              <AlertCircle className="h-5 w-5 text-slate-400" />
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold">관리자(Master)</p>
                <p className="text-[10px] text-muted-foreground">최고권한</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold">A</div>
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </SidebarInset>
      <RoleSelector />
    </SidebarProvider>
  );
}

function AdminSidebar() {
  return (
    <Sidebar className="border-r border-white/10 bg-slate-900 text-white">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-accent">
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-xl tracking-tight text-white">MediLaundry</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-white/5 h-12" tooltip="대시보드">
              <Link href="/admin">
                <LayoutDashboard /> <span>대시보드</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-white/5 h-12" tooltip="병원 관리">
              <Link href="/admin/hospitals">
                <Hospital /> <span>병원 관리</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-white/5 h-12" tooltip="기사 관리">
              <Link href="/admin/drivers">
                <Truck /> <span>기사 관리</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-white/5 h-12" tooltip="전체 요청">
              <Link href="/admin/requests">
                <ClipboardList /> <span>전체 요청 내역</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-white/5 h-12" tooltip="차이 발생 큐">
              <Link href="/admin/discrepancies">
                <AlertCircle className="text-orange-400" /> <span>차이 발생 모니터링</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-white/5 h-12" tooltip="납품 관리">
              <Link href="/admin/delivery">
                <Package /> <span>납품/출고 관리</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-white/5 h-12" tooltip="정산">
              <Link href="/admin/settlements">
                <CreditCard /> <span>정산 관리</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-white/5 h-12" tooltip="통계">
              <Link href="/admin/stats">
                <BarChart3 /> <span>통계 리포트</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-auto pt-8 border-t border-white/10">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="hover:bg-white/5 h-12" tooltip="설정">
                <Link href="/admin/settings">
                  <Settings /> <span>시스템 설정</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="hover:bg-destructive/10 text-destructive h-12" tooltip="로그아웃">
                <Link href="/">
                  <LogOut /> <span>로그아웃</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
