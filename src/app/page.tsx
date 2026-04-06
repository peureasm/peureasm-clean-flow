"use client"

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Factory,
  Hospital,
  Loader2,
  ShieldCheck,
  Truck,
  UserCog,
  UserPlus,
} from 'lucide-react';

import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const roleCards = [
  {
    title: '병원 담당자',
    description: '수거 요청을 등록하고 납품 확인과 최종 확인을 한 흐름에서 처리합니다.',
    icon: Hospital,
    accent: 'from-blue-500/15 to-cyan-500/10',
  },
  {
    title: '기사',
    description: '배정된 병원과 작업 상태를 확인하고 수거와 배송 이력을 빠르게 기록합니다.',
    icon: Truck,
    accent: 'from-emerald-500/15 to-teal-500/10',
  },
  {
    title: '공장',
    description: '입고 수량, 처리 상태, 차이 발생 건을 운영 화면에서 이어서 관리합니다.',
    icon: Factory,
    accent: 'from-amber-500/15 to-orange-500/10',
  },
  {
    title: '관리자',
    description: '권한 승인, 배정, 정산 대기, 차이 모니터링을 통합 운영 화면으로 관리합니다.',
    icon: UserCog,
    accent: 'from-violet-500/15 to-indigo-500/10',
  },
] as const;

const summaryCards = [
  {
    label: '운영 흐름',
    value: '요청 -> 배정 -> 처리 -> 정산',
    description: '전체 요청 내역에서 정산 대기와 종결까지 한 번에 추적합니다.',
  },
  {
    label: '권한 분기',
    value: '병원 / 기사 / 공장 / 관리자',
    description: '로그인 후 계정 권한에 맞는 화면으로 자동 연결됩니다.',
  },
  {
    label: '운영 포인트',
    value: '권한 승인 · 기사 배정 · 차이 대응',
    description: '운영자가 놓치기 쉬운 업무를 대기열 중심으로 볼 수 있습니다.',
  },
] as const;

const flowSteps = [
  { title: '병원 요청 등록', detail: '품목 선택과 주소 기반 요청 접수', tone: 'bg-blue-50 text-blue-700 border-blue-100' },
  { title: '기사 배정 및 진행', detail: '담당 병원과 작업 상태 실시간 확인', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { title: '공장 처리 및 차이 대응', detail: '입고 수량 확인과 예외 상황 대응', tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  { title: '관리자 정산 종결', detail: '정산 대기 목록과 요청 종결 처리', tone: 'bg-violet-50 text-violet-700 border-violet-100' },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const { user, userData, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user && userData?.role) {
      router.replace(`/${userData.role.toLowerCase()}`);
      return;
    }

    if (!isUserLoading && user && userData && !userData.role) {
      router.replace('/pending');
    }
  }, [isUserLoading, router, user, userData]);

  if (isUserLoading || (user && !userData?.role)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-5 px-6">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-primary/20 ring-1 ring-white/10">
          <Hospital className="h-11 w-11 text-primary" />
          <div className="absolute -right-2 -top-2 rounded-full bg-white p-2 text-primary shadow-xl">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-2xl font-black tracking-tight">권한과 운영 화면을 확인하는 중입니다.</p>
          <p className="text-sm text-slate-300">계정 상태를 확인한 뒤 알맞은 화면으로 바로 연결합니다.</p>
        </div>
      </div>
    );
  }

  const dashboardHref = userData?.role ? `/${userData.role.toLowerCase()}` : '/login';

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(78,93,234,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#f4f7fb_45%,_#eef2f8_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <Hospital className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-950">Clean-Flow</p>
              <p className="text-xs font-semibold text-slate-500">병원 세탁물 운영 통합 플랫폼</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Button asChild variant="ghost" className="hidden rounded-xl px-4 font-bold text-slate-600 sm:inline-flex">
                  <Link href="/login?tab=signup">회원가입</Link>
                </Button>
                <Button asChild className="rounded-2xl px-5 font-bold shadow-lg shadow-primary/20">
                  <Link href="/login">
                    시작하기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild className="rounded-2xl px-5 font-bold shadow-lg shadow-primary/20">
                <Link href={dashboardHref}>
                  내 대시보드
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-14 px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pt-14">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-sm font-bold text-primary shadow-sm shadow-primary/5">
              <ShieldCheck className="h-4 w-4" />
              병원 · 기사 · 공장 · 관리자 권한을 하나의 흐름으로 연결합니다
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                수거 요청부터 정산까지
                <span className="block bg-gradient-to-r from-primary via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                  역할에 맞는 운영 화면으로 더 명확하게
                </span>
              </h1>
              <p className="max-w-2xl text-lg font-medium leading-8 text-slate-600 sm:text-xl">
                Clean-Flow는 병원 세탁물 운영에서 필요한 요청 등록, 기사 배정, 공장 처리,
                정산과 차이 대응까지를 하나의 데이터 흐름으로 관리합니다.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-14 rounded-2xl px-7 text-base font-black shadow-xl shadow-primary/20">
                <Link href={user ? dashboardHref : '/login'}>
                  {user ? '대시보드 바로가기' : '로그인하고 시작하기'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {!user && (
                <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl border-slate-200 bg-white/80 px-7 text-base font-black text-slate-700">
                  <Link href="/login?tab=signup">
                    계정 등록 요청
                    <UserPlus className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {summaryCards.map((card) => (
                <Card key={card.label} className="rounded-[28px] border-white/70 bg-white/85 shadow-lg shadow-slate-200/60">
                  <CardContent className="space-y-3 p-6">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                    <p className="text-lg font-black leading-snug text-slate-950">{card.value}</p>
                    <p className="text-sm leading-6 text-slate-500">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-6 rounded-[36px] bg-primary/10 blur-3xl" />
            <Card className="relative overflow-hidden rounded-[36px] border-white/70 bg-slate-950 text-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.75)]">
              <CardContent className="space-y-8 p-7 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-primary/80">운영 흐름 미리보기</p>
                    <h2 className="text-2xl font-black tracking-tight">현재 시스템에 맞춘 역할별 연결 구조</h2>
                    <p className="text-sm leading-6 text-slate-300">
                      로그인 후 권한에 맞는 화면으로 진입하고, 요청 상태는 관리자 운영 화면에서 정산까지 이어집니다.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                    <p className="text-xs font-bold text-slate-400">권한 자동 분기</p>
                    <p className="text-lg font-black text-white">활성화</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {flowSteps.map((step, index) => (
                    <div key={step.title} className="flex gap-4 rounded-[28px] border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col items-center gap-2 pt-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950">
                          {index + 1}
                        </div>
                        {index < flowSteps.length - 1 && <div className="h-full w-px bg-white/10" />}
                      </div>
                      <div className="flex-1 space-y-2 pb-1">
                        <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${step.tone}`}>
                          {step.title}
                        </div>
                        <p className="text-sm leading-6 text-slate-300">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-black text-white">전체 요청 내역 중심 운영</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">정산 대기와 종결 상태가 따로 흩어지지 않고 요청 흐름 안에서 보입니다.</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-black text-white">표준화 입력 강화</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">품목과 주소는 자유 입력보다 선택형과 검색형 입력에 맞춰 관리됩니다.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">Role Based Workspace</p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">역할별로 처음 보는 정보도 다르게 구성됩니다</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              같은 시스템이어도 업무 기준이 다르기 때문에, 첫 화면부터 역할별 핵심 작업이 바로 보이도록 설계되어야 합니다.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roleCards.map((role) => {
              const Icon = role.icon;
              return (
                <Card key={role.title} className={`overflow-hidden rounded-[30px] border-white/70 bg-gradient-to-br ${role.accent} shadow-lg shadow-slate-200/60`}>
                  <CardContent className="flex h-full flex-col gap-5 p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black tracking-tight text-slate-950">{role.title}</h3>
                      <p className="text-sm leading-6 text-slate-600">{role.description}</p>
                    </div>
                    <div className="mt-auto inline-flex items-center gap-2 text-sm font-black text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      권한에 맞는 대시보드로 자동 연결
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[32px] border-white/70 bg-white/90 shadow-lg shadow-slate-200/60">
            <CardContent className="space-y-6 p-7 sm:p-8">
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">Current Capability</p>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">현재 반영된 핵심 기능</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-[24px] bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <p className="font-black text-slate-950">요청과 정산의 통합 운영</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">전체 요청 내역에서 진행 상태, 정산 대기, 종결을 한 화면 흐름으로 확인할 수 있습니다.</p>
                </div>
                <div className="rounded-[24px] bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <p className="font-black text-slate-950">병원 · 기사 상세 운영 화면 고도화</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">요약 카드, 체크포인트, 탭 구조로 현재 상태와 필요한 액션을 더 명확하게 보여줍니다.</p>
                </div>
                <div className="rounded-[24px] bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <p className="font-black text-slate-950">서버 중심 초대 및 권한 흐름</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">초대 링크는 대상 사용자 기준으로 발급되고, 권한 수락도 서버 검증을 거쳐 처리됩니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-white/70 bg-white/90 shadow-lg shadow-slate-200/60">
            <CardContent className="space-y-6 p-7 sm:p-8">
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">Getting Started</p>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">처음 사용하는 경우 이렇게 시작하면 됩니다</h2>
              </div>
              <div className="space-y-4">
                {[
                  '계정을 만들고 병원, 기사, 공장, 관리자 중 필요한 권한을 요청합니다.',
                  '관리자 승인이 끝나면 로그인 후 해당 역할 대시보드로 자동 이동합니다.',
                  '운영자는 사용자 승인, 병원/기사 배정, 요청 진행, 정산 대기를 순서대로 관리합니다.',
                ].map((text, index) => (
                  <div key={text} className="flex gap-4 rounded-[24px] bg-slate-50 p-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 flex-1 rounded-2xl font-black shadow-lg shadow-primary/15">
                  <Link href={user ? dashboardHref : '/login'}>
                    {user ? '대시보드로 이동' : '로그인'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {!user && (
                  <Button asChild variant="outline" className="h-12 flex-1 rounded-2xl border-slate-200 bg-white font-black text-slate-700">
                    <Link href="/login?tab=signup">회원가입 요청</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
