
"use client"

import RoleSelector from '@/components/layout/RoleSelector';
import { SidebarProvider, SidebarInset, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { LayoutDashboard, Hospital, Settings, ClipboardList, AlertCircle, BarChart3, LogOut, Package, Truck, ListIcon, Users, ShieldAlert, Loader2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useUser, useAuth, initiateSignOut } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-slate-400">관리자 권한 확인 중...</p>
      </div>
    );
  }

  // 2. 권한 체크 (userData가 로드된 후 Role 확인)
  if (userData && userData.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-8">
        <Card className="max-w-md w-full p-10 text-center space-y-6 rounded-[40px] border-none shadow-2xl bg-white">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto border border-red-100">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">접근 권한 없음</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              이 페이지는 <span className="text-red-500 font-bold">총괄 관리자</span> 권한이 필요합니다.<br/>
              현재 '{userData.role}' 권한으로는 접근할 수 없습니다.
            </p>
          </div>
          <Button asChild className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold">
            <Link href="/">메인으로 돌아가기</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 sm:px-8 soft-shadow z-10">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <div className="flex-1">
            <h2 className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-[0.2em] line-clamp-1">MediLaundry Flow System</h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative cursor-pointer hover:opacity-70 transition-opacity hidden sm:block">
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-chart-3 rounded-full border-2 border-white"></div>
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-6 w-px bg-border hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden xs:block">
                <p className="text-sm font-bold text-foreground line-clamp-1">{userData?.name || '관리자'}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Super Admin</p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-btn bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 shrink-0">
                {userData?.name?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
          {children}
        </div>
      </SidebarInset>
      <RoleSelector />
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    if (auth) {
      initiateSignOut(auth);
      router.push('/');
    }
  };

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: '대시보드' },
    { href: '/admin/hospitals', icon: Hospital, label: '병원 관리' },
    { href: '/admin/drivers', icon: Truck, label: '기사 관리' },
    { href: '/admin/items', icon: ListIcon, label: '품목 관리' },
    { href: '/admin/users', icon: Users, label: '사용자/권한 관리' },
    { href: '/admin/requests', icon: ClipboardList, label: '전체 요청 내역' },
    { href: '/admin/settlements', icon: CreditCard, label: '정산 관리' },
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
                onClick={handleLogout}
                className="hover:bg-destructive/10 text-destructive/80 hover:text-destructive h-12 rounded-btn px-4 w-full justify-start gap-3" 
                tooltip="로그아웃"
              >
                <LogOut className="h-5 w-5" /> <span className="font-bold">로그아웃</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
