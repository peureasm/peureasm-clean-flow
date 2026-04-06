/**
 * 저장소에 항상 포함되는 총괄관리자 이메일 (env 없이도 동작).
 * 추가 관리자는 NEXT_PUBLIC_ADMIN_EMAILS 로 확장.
 */
const BUILTIN_ADMIN_EMAILS = ['peureasm@gmail.com'] as const;

/**
 * 콤마로 구분한 관리자 이메일 목록 (소문자로 비교).
 * .env.local 예: NEXT_PUBLIC_ADMIN_EMAILS=admin@hospital.com,ceo@company.com
 */
export function getAdminEmailSet(): Set<string> {
  const set = new Set<string>(
    BUILTIN_ADMIN_EMAILS.map((e) => e.toLowerCase())
  );
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '';
  for (const s of raw.split(',')) {
    const t = s.trim().toLowerCase();
    if (t) set.add(t);
  }
  return set;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmailSet().has(email.trim().toLowerCase());
}
