import type { Auth } from 'firebase/auth';

function extractErrorMessage(data: unknown): string {
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    typeof (data as { error?: unknown }).error === 'string'
  ) {
    return (data as { error: string }).error;
  }

  return 'Request failed.';
}

export async function postAuthenticatedJson<T>(
  auth: Auth | null,
  url: string,
  body: Record<string, unknown>
): Promise<T> {
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    throw new Error('Login is required.');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...body,
      idToken,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  return data as T;
}
