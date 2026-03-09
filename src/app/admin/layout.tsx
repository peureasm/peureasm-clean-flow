"use client"

import RoleSelector from '@/components/layout/RoleSelector';
import { SidebarProvider, SidebarInset, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, Hospital, Settings, ClipboardList, AlertCircle, BarChart3, LogOut, Package, Truck } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-8 soft-shadow z-10">
          <div className="flex-1">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">MediLaundry Flow System</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer hover:opacity-70 transition-opacity">
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-chart-3 rounded-full border-2 border-white"></div>
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-6 w-px bg-border"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{userData?.name || '관리자'}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Super Admin</p>
              </div>
              <div className="h-10 w-10 rounded-btn bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">
                {userData?.name?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
          {children}
        </div>
      </SidebarInset>
      <RoleSelector />
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: '대시보드' },
    { href: '/admin/hospitals', icon: Hospital, label: '병원 관리' },
    { href: '/admin/drivers', icon: Truck, label: '기사 관리' },
    { href: '/admin/requests', icon: ClipboardList, label: '전체 요청 내역' },
    { href: '/admin/discrepancies', icon: AlertCircle, label: '차이 발생 모니터링', alert: true },
    { href: '/admin/stats', icon: BarChart3, label: '통계 리포트' },
  ];

  return (
    <Sidebar className="border-r border-border bg-white w-[240px]">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-3 font-black text-primary">
          <div className="p-1.5 bg-primary rounded-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl tracking-tighter">MediLaundry</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4 bg-white">
        <SidebarMenu className="gap-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={`
                    h-12 rounded-btn transition-all duration-200 px-4
                    hover:bg-accent hover:text-primary
                    data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-primary/20
                  `}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon className={`h-5 w-5 ${item.alert && !isActive ? 'text-chart-3' : ''}`} /> 
                    <span className="font-bold">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <div className="mt-auto pt-8 border-t border-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                className="hover:bg-accent h-12 rounded-btn text-muted-foreground hover:text-primary px-4" 
                tooltip="설정"
              >
                <Link href="/admin/settings">
                  <Settings className="h-5 w-5" /> <span className="font-bold">시스템 설정</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                className="hover:bg-destructive/10 text-destructive/80 hover:text-destructive h-12 rounded-btn px-4" 
                tooltip="로그아웃"
              >
                <Link href="/">
                  <LogOut className="h-5 w-5" /> <span className="font-bold">로그아웃</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}