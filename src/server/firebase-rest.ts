import { firebaseConfig } from '@/firebase/config';
import type { UserRole } from '@/app/lib/types';
import { isAdminEmail } from '@/lib/admin-emails';

export interface AuthLookupUser {
  localId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  disabled?: boolean;
}

export interface AppUserRecord {
  id: string;
  username?: string;
  name?: string;
  role?: UserRole | null;
  roleRequested?: UserRole | null;
  hospitalId?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

interface FirestoreValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  nullValue?: null;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
}

export class FirebaseRestError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'FirebaseRestError';
    this.status = status;
    this.body = body;
  }
}

function buildIdentityToolkitUrl(path: string): string {
  return `https://identitytoolkit.googleapis.com/v1/${path}?key=${firebaseConfig.apiKey}`;
}

function buildFirestoreUrl(documentPath: string, queryParams?: URLSearchParams): string {
  const normalizedPath = documentPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${normalizedPath}`
  );

  if (queryParams) {
    queryParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function requestJson<T>(input: string, init: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await parseResponse(response);

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' &&
      data &&
      'error' in data &&
      typeof (data as { error?: { message?: string } }).error?.message === 'string'
        ? (data as { error: { message: string } }).error.message
        : `Request failed with status ${response.status}.`;

    throw new FirebaseRestError(response.status, errorMessage, data);
  }

  return data as T;
}

function encodeFirestoreValue(value: unknown): FirestoreValue {
  if (value === null) {
    return { nullValue: null };
  }

  if (typeof value === 'string') {
    return { stringValue: value };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((entry) => encodeFirestoreValue(entry)),
      },
    };
  }

  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: encodeFirestoreFields(value as Record<string, unknown>),
      },
    };
  }

  throw new Error(`Unsupported Firestore value type: ${typeof value}`);
}

function encodeFirestoreFields(data: Record<string, unknown>): Record<string, FirestoreValue> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, encodeFirestoreValue(value)])
  );
}

function decodeFirestoreValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue ?? '';
  if ('booleanValue' in value) return value.booleanValue ?? false;
  if ('integerValue' in value) return Number(value.integerValue ?? 0);
  if ('doubleValue' in value) return value.doubleValue ?? 0;
  if ('nullValue' in value) return null;
  if (value.arrayValue) {
    return (value.arrayValue.values || []).map((entry) => decodeFirestoreValue(entry));
  }
  if (value.mapValue) {
    const fields = value.mapValue.fields || {};
    return Object.fromEntries(
      Object.entries(fields).map(([key, entry]) => [key, decodeFirestoreValue(entry)])
    );
  }

  return undefined;
}

function parseFirestoreDocument<T extends object>(
  document: FirestoreDocument
): T {
  const fields = document.fields || {};
  const parsed = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)])
  ) as T & { id?: string };
  const id = document.name.split('/').pop() || '';

  return {
    ...parsed,
    id: parsed.id || id,
  };
}

function buildFirestoreHeaders(idToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  };
}

export async function lookupAuthUser(idToken: string): Promise<AuthLookupUser> {
  const result = await requestJson<{ users?: AuthLookupUser[] }>(
    buildIdentityToolkitUrl('accounts:lookup'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
    }
  );

  const authUser = result.users?.[0];

  if (!authUser?.localId) {
    throw new FirebaseRestError(401, 'Authenticated user was not found.');
  }

  if (authUser.disabled) {
    throw new FirebaseRestError(403, 'Authenticated user is disabled.');
  }

  return authUser;
}

export async function getUserDocument(
  idToken: string,
  userId: string
): Promise<AppUserRecord | null> {
  const response = await fetch(buildFirestoreUrl(`users/${userId}`), {
    method: 'GET',
    headers: buildFirestoreHeaders(idToken),
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new FirebaseRestError(response.status, 'Unable to read user document.', data);
  }

  return parseFirestoreDocument<AppUserRecord>(data as FirestoreDocument);
}

export async function patchUserDocument(
  idToken: string,
  userId: string,
  data: Partial<AppUserRecord>
): Promise<AppUserRecord> {
  const updateMask = new URLSearchParams();

  Object.keys(data).forEach((key) => {
    updateMask.append('updateMask.fieldPaths', key);
  });

  const response = await requestJson<FirestoreDocument>(
    buildFirestoreUrl(`users/${userId}`, updateMask),
    {
      method: 'PATCH',
      headers: buildFirestoreHeaders(idToken),
      body: JSON.stringify({
        fields: encodeFirestoreFields(data as Record<string, unknown>),
      }),
      cache: 'no-store',
    }
  );

  return parseFirestoreDocument<AppUserRecord>(response);
}

export function assertAdminAccess(
  authUser: AuthLookupUser,
  profile: AppUserRecord | null
): void {
  if (isAdminEmail(authUser.email) || profile?.role === 'ADMIN') {
    return;
  }

  throw new FirebaseRestError(403, 'Admin access is required.');
}
