"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertCircle,
  BarChart3,
  ClipboardList,
  Hospital,
  LayoutDashboard,
  ListIcon,
  Loader2,
  LogOut,
  Package,
  ShieldAlert,
  Truck,
  Users,
} from 'lucide-react';

import { useAuth, useUser, initiateSignOut } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, router, user]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-slate-400">관리자 권한을 확인하는 중입니다...</p>
      </div>
    );
  }

  if (userData && !userData.role) {
    router.push('/pending');
    return null;
  }

  if (userData && userData.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <Card className="w-full max-w-md space-y-6 rounded-[40px] border-none bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">접근 권한 없음</h1>
            <p className="font-medium leading-relaxed text-slate-500">
              이 페이지는 <span className="font-bold text-red-500">최고 관리자</span> 권한이 필요합니다.
              <br />
              현재 '{userData.role}' 권한으로는 접근할 수 없습니다.
            </p>
          </div>
          <Button asChild className="h-14 w-full rounded-2xl bg-slate-900 font-bold text-white">
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
        <header className="soft-shadow z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 sm:px-8">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <div className="flex-1">
            <h2 className="line-clamp-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
              Clean-flow System
            </h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative hidden cursor-pointer transition-opacity hover:opacity-70 sm:block">
              <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-chart-3"></div>
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="hidden h-6 w-px bg-border sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right xs:block">
                <p className="line-clamp-1 text-sm font-bold text-foreground">{userData?.name || '관리자'}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Super Admin</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-primary font-black text-white shadow-lg shadow-primary/20 sm:h-10 sm:w-10">
                {userData?.name?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1600px] animate-in fade-in p-4 duration-500 sm:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      await initiateSignOut(auth);
      router.push('/login');
    }
  };

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: '대시보드' },
    { href: '/admin/items', icon: ListIcon, label: '품목 관리' },
    { href: '/admin/users', icon: Users, label: '사용자/권한 관리' },
    { href: '/admin/hospitals', icon: Hospital, label: '병원 관리' },
    { href: '/admin/drivers', icon: Truck, label: '기사 관리' },
    { href: '/admin/requests', icon: ClipboardList, label: '전체 요청 내역' },
    { href: '/admin/discrepancies', icon: AlertCircle, label: '차이 발생 모니터링', alert: true },
    { href: '/admin/stats', icon: BarChart3, label: '통계 리포트' },
  ];

  return (
    <Sidebar className="w-[240px] border-r border-border bg-white">
      <SidebarHeader className="flex h-16 items-center border-b border-border px-6">
        <Link href="/admin" className="flex items-center gap-3 font-black text-primary">
          <div className="rounded-lg bg-primary p-1.5">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl tracking-tighter">MediLaundry</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-white p-4">
        <SidebarMenu className="gap-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="h-12 rounded-btn px-4 transition-all duration-200 hover:bg-accent hover:text-primary data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-primary/20"
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

        <div className="mt-auto border-t border-border pt-8">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="h-12 w-full justify-start gap-3 rounded-btn px-4 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
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
