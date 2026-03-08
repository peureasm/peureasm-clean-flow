
"use client"

import RoleSelector from '@/components/layout/RoleSelector';
import { SidebarProvider, SidebarInset, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, Hospital, Settings, ClipboardList, AlertCircle, BarChart3, CreditCard, LogOut, Package, Truck } from 'lucide-react';
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
      <SidebarInset className="bg-[#F2F5F8]">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-6 shadow-sm">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Admin Control Center</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></div>
              <AlertCircle className="h-5 w-5 text-slate-400" />
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold">{userData?.name || '관리자'}</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase">최고권한 (Master)</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">
                {userData?.name?.[0] || 'A'}
              </div>
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
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: '대시보드' },
    { href: '/admin/hospitals', icon: Hospital, label: '병원 관리' },
    { href: '/admin/drivers', icon: Truck, label: '기사 관리' },
    { href: '/admin/requests', icon: ClipboardList, label: '전체 요청 내역' },
    { href: '/admin/discrepancies', icon: AlertCircle, label: '차이 발생 모니터링', alert: true },
    { href: '/admin/delivery', icon: Package, label: '납품/출고 관리' },
    { href: '/admin/settlements', icon: CreditCard, label: '정산 관리' },
    { href: '/admin/stats', icon: BarChart3, label: '통계 리포트' },
  ];

  return (
    <Sidebar className="border-r border-white/10 bg-slate-900 text-white">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-accent">
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-xl tracking-tight text-white font-black">MediLaundry</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu className="gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={`
                    h-12 rounded-xl transition-all duration-200
                    hover:bg-white/10 hover:text-white
                    data-[active=true]:bg-accent data-[active=true]:text-slate-900 data-[active=true]:shadow-lg data-[active=true]:shadow-accent/20
                  `}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon className={`${item.alert && !isActive ? 'text-orange-400' : ''}`} /> 
                    <span className="font-bold">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <div className="mt-auto pt-8 border-t border-white/10">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                className="hover:bg-white/10 h-12 rounded-xl text-slate-400 hover:text-white" 
                tooltip="설정"
              >
                <Link href="/admin/settings">
                  <Settings /> <span className="font-bold">시스템 설정</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                className="hover:bg-destructive/20 text-destructive/80 hover:text-destructive h-12 rounded-xl" 
                tooltip="로그아웃"
              >
                <Link href="/">
                  <LogOut /> <span className="font-bold">로그아웃</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
