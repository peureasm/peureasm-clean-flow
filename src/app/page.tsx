"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Hospital,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";

const roleOverview = [
  { title: "병원", description: "수거 요청 등록과 납품 확인을 담당합니다." },
  { title: "기사", description: "병원 방문, 수거·배송 상태 처리를 담당합니다." },
  { title: "공장", description: "입고 수량, 처리 상태, 차이 대응을 담당합니다." },
  { title: "관리자", description: "권한 승인, 배정, 정산 흐름 운영을 담당합니다." },
] as const;

const featureCards = [
  {
    title: "요청부터 정산까지 한 흐름",
    description: "요청, 배정, 처리, 정산 상태를 분리하지 않고 같은 흐름에서 추적합니다.",
  },
  {
    title: "권한 기반 자동 진입",
    description: "로그인 후 병원/기사/공장/관리자 화면으로 자동 연결됩니다.",
  },
  {
    title: "운영 우선순위 집중",
    description: "처리 대기, 차이 발생, 승인 항목을 먼저 보여 빠른 대응을 돕습니다.",
  },
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
      router.replace("/pending");
    }
  }, [isUserLoading, router, user, userData]);

  if (isUserLoading || (user && !userData?.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-bold">계정 상태를 확인하는 중입니다.</p>
      </div>
    );
  }

  const dashboardHref = userData?.role ? `/${userData.role.toLowerCase()}` : "/login";

  return (
    <div className="min-h-screen bg-[#eff1f5] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#eff1f5]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2">
            <Hospital className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-primary">Clean-Flow</p>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild className="h-8 rounded-lg bg-primary px-3 text-xs font-bold">
                <Link href={dashboardHref}>
                  대시보드
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="h-8 px-2 text-xs font-medium text-slate-600">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 text-xs font-bold">
                  <Link href="/login?tab=signup">
                    Free Trial
                    <Sparkles className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10 sm:px-8">
        <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="space-y-5">
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              병원 세탁물 운영을
              <span className="block text-indigo-600">한 화면에서 관리</span>
            </h1>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Clean-Flow는 수거 요청, 기사 배정, 공장 처리, 정산까지 병원 세탁물 운영의 전 과정을 연결합니다.
            </p>
            
          </div>

          <div className="rounded-3xl bg-[#ebeaf2] p-4 sm:p-5">
            <div className="relative aspect-[1280/820] w-full">
              <div className="absolute left-[19.3%] top-[17.8%] h-[59.3%] w-[61.6%] overflow-hidden rounded-[6px]">
                <Image
                  src="/images/cleanflow-preview-16x9.svg"
                  alt="Clean-Flow 시스템 화면 미리보기"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <Image
                src="/images/laptop-frame.svg"
                alt="노트북 목업 프레임"
                fill
                unoptimized
                className="object-contain"
                priority
              />
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["98%", "요청 처리율", "실시간 확인과 자동화된 상태 업데이트로 운영 지연을 최소화합니다."],
              ["4 Roles", "역할 분기", "병원, 기사, 공장, 관리자의 화면을 권한에 맞게 자동 연결합니다."],
              ["24/7", "모니터링", "이슈 발생과 처리 대기 항목을 상시 추적해 빠르게 대응합니다."],
            ].map(([value, label, desc]) => (
              <div key={value} className="rounded-2xl border border-slate-200 bg-[#f0f2f6] p-8">
                <p className="text-3xl font-black text-indigo-600">{value}</p>
                <p className="text-sm font-bold text-slate-800">{label}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900">Unified Ecosystem</h2>
            <p className="mt-1 text-xs text-slate-500">
              병원 세탁물 운영 라이프사이클의 각 역할에 맞춘 인터페이스를 제공합니다.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {roleOverview.map((role) => (
              <div key={role.title} className="rounded-2xl bg-[#f0f2f6] p-4">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                  <Hospital className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-base font-black text-slate-900">{role.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{role.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          
        </section>

        <section className="mt-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-center text-white shadow-lg shadow-indigo-500/25">
          <div>
            <h3 className="text-3xl font-black text-white text-slate-900">Operational Excellence</h3>
            <p className="mt-2 text-sm leading-6 text-white text-slate-600">
              Clean-Flow는 병원 세탁물 운영에서 필요한 요청 등록, 배정, 처리, 정산 기록을 표준화합니다.
            </p>
          </div>

          <div className="space-y-3 flex gap-6">
            {featureCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-[#fff] p-4" style={{height: '120px'}}>
                <div className="inline-flex items-center gap-2 text-indigo-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-sm font-bold">{card.title}</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{card.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
