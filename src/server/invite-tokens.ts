import { createHmac, timingSafeEqual } from 'crypto';

export type InviteRole = 'HOSPITAL' | 'DRIVER';

export interface InvitePayload {
  role: InviteRole;
  hospitalId: string | null;
  targetUserId: string | null;
  targetEmail: string | null;
  issuedAt: string;
  expiresAt: string;
}

const DEFAULT_INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getInviteSecret(): string {
  const secret =
    process.env.INVITE_TOKEN_SECRET?.trim() ||
    process.env.NEXT_PRIVATE_INVITE_TOKEN_SECRET?.trim() ||
    '';

  if (!secret) {
    throw new Error('Invite token secret is not configured.');
  }

  return secret;
}

function toBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function sign(value: string): string {
  return toBase64Url(createHmac('sha256', getInviteSecret()).update(value).digest());
}

export function createInviteToken(input: {
  role: InviteRole;
  hospitalId?: string | null;
  targetUserId?: string | null;
  targetEmail?: string | null;
  ttlMs?: number;
}): { token: string; payload: InvitePayload } {
  const ttlMs = input.ttlMs ?? DEFAULT_INVITE_TTL_MS;
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const payload: InvitePayload = {
    role: input.role,
    hospitalId: input.role === 'HOSPITAL' ? input.hospitalId ?? null : null,
    targetUserId: input.role === 'DRIVER' ? input.targetUserId ?? null : null,
    targetEmail: input.role === 'DRIVER' ? input.targetEmail ?? null : null,
    issuedAt,
    expiresAt,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    payload,
  };
}

export function verifyInviteToken(token: string): InvitePayload {
  const [encodedPayload, providedSignature] = token.split('.');

  if (!encodedPayload || !providedSignature) {
    throw new Error('Invalid invite token format.');
  }

  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invite token signature mismatch.');
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, 'base64url').toString('utf8')
  ) as Partial<InvitePayload>;

  if (payload.role !== 'HOSPITAL' && payload.role !== 'DRIVER') {
    throw new Error('Invite token role is invalid.');
  }

  if (!payload.issuedAt || !payload.expiresAt) {
    throw new Error('Invite token is incomplete.');
  }

  if (payload.role === 'HOSPITAL' && !payload.hospitalId) {
    throw new Error('Hospital invite token is missing a hospital id.');
  }

  if (Date.parse(payload.expiresAt) <= Date.now()) {
    throw new Error('Invite token has expired.');
  }

  return {
    role: payload.role,
    hospitalId: payload.hospitalId ?? null,
    targetUserId: payload.targetUserId ?? null,
    targetEmail: payload.targetEmail ?? null,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  };
}
