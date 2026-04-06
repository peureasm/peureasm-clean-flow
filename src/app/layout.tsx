import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import UserProfileSync from '@/components/layout/UserProfileSync';

export const metadata: Metadata = {
  title: 'Clean-Flow | 병원 세탁물 운영 통합 플랫폼',
  description: '병원, 기사, 공장, 관리자를 하나의 흐름으로 연결해 요청, 배정, 처리, 정산을 통합 관리하는 시스템입니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-secondary/30">
        <FirebaseClientProvider>
          {children}
          <Toaster />
          <UserProfileSync />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
