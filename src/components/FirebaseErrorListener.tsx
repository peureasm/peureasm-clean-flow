
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, Terminal, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * 전역 Firestore 권한 에러를 감지하여 사용자 친화적인 다이얼로그로 표시하는 컴포넌트
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // 보안 규칙 위반 에러가 발생하면 상태에 저장하여 다이얼로그를 띄움
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, []);

  const handleCopyJson = () => {
    if (!error) return;
    navigator.clipboard.writeText(JSON.stringify(error.request, null, 2));
    setIsCopied(true);
    toast({ title: "로그 복사 완료", description: "기술 지원을 위한 에러 로그가 클립보드에 저장되었습니다." });
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!error) return null;

  return (
    <AlertDialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
      <AlertDialogContent className="rounded-[32px] border-none shadow-2xl max-w-lg p-0 overflow-hidden bg-white">
        <div className="bg-destructive/5 p-8 flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive border border-destructive/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">접근 권한이 없습니다</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
              요청하신 데이터에 접근할 수 있는 권한이 부족합니다.<br/>
              현재 역할({error.request.auth?.token?.sign_in_provider})에 배정된 권한을 확인해 주세요.
            </AlertDialogDescription>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Terminal className="h-3 w-3" /> Technical Context
              </p>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold gap-1 text-primary hover:bg-primary/5" onClick={handleCopyJson}>
                {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy Log
              </Button>
            </div>
            <div className="bg-slate-900 rounded-2xl p-5 font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800 shadow-inner">
              <p><span className="text-emerald-400">path:</span> "{error.request.path}"</p>
              <p><span className="text-emerald-400">method:</span> "{error.request.method}"</p>
              <p><span className="text-emerald-400">uid:</span> "{error.request.auth?.uid?.slice(0, 12)}..."</p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setError(null)}
              className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              확인하였습니다
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
