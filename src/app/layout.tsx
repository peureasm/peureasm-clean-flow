
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import RoleSelector from '@/components/layout/RoleSelector';

export const metadata: Metadata = {
  title: 'MediLaundry Flow | 병원 세탁물 통합 관리 시스템',
  description: '병원-기사-공장을 잇는 스마트 세탁물 수거 및 공정 관리 솔루션',
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
          <RoleSelector />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
