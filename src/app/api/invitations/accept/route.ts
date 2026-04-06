import { NextRequest, NextResponse } from 'next/server';
import {
  FirebaseRestError,
  getUserDocument,
  lookupAuthUser,
  patchUserDocument,
  type AppUserRecord,
} from '@/server/firebase-rest';
import { verifyInviteToken } from '@/server/invite-tokens';
import { isAdminEmail } from '@/lib/admin-emails';

interface AcceptInviteRequest {
  idToken?: string;
  inviteToken?: string;
}

function buildPendingProfile(
  existingUser: AppUserRecord | null,
  authUser: Awaited<ReturnType<typeof lookupAuthUser>>,
  invite: ReturnType<typeof verifyInviteToken>
): Partial<AppUserRecord> {
  const now = new Date().toISOString();
  const fallbackName =
    authUser.displayName?.trim() ||
    authUser.email?.trim() ||
    `user_${authUser.localId.slice(0, 8)}`;
  const fallbackUsername =
    authUser.email?.trim() || `user_${authUser.localId.slice(0, 8)}`;

  if (!existingUser) {
    return {
      id: authUser.localId,
      username: fallbackUsername,
      name: fallbackName,
      role: isAdminEmail(authUser.email) ? 'ADMIN' : null,
      roleRequested: invite.role,
      hospitalId: invite.role === 'HOSPITAL' ? invite.hospitalId : null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    username: existingUser.username || fallbackUsername,
    name: existingUser.name || fallbackName,
    roleRequested: invite.role,
    hospitalId: invite.role === 'HOSPITAL' ? invite.hospitalId : null,
    updatedAt: now,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AcceptInviteRequest;
    const idToken = body.idToken?.trim();
    const inviteToken = body.inviteToken?.trim();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing id token.' }, { status: 401 });
    }

    if (!inviteToken) {
      return NextResponse.json({ error: 'Missing invite token.' }, { status: 400 });
    }

    const authUser = await lookupAuthUser(idToken);
    const invite = verifyInviteToken(inviteToken);
    const existingUser = await getUserDocument(idToken, authUser.localId);

    if (
      invite.role === 'DRIVER' &&
      invite.targetEmail &&
      authUser.email?.trim().toLowerCase() !== invite.targetEmail
    ) {
      return NextResponse.json(
        { error: '이 초대 링크는 지정된 기사 계정에만 사용할 수 있습니다.' },
        { status: 403 }
      );
    }

    if (existingUser?.role) {
      return NextResponse.json({
        ok: true,
        status: 'already-approved',
        role: existingUser.role,
      });
    }

    const payload = buildPendingProfile(existingUser, authUser, invite);
    const updatedUser = await patchUserDocument(idToken, authUser.localId, payload);

    return NextResponse.json({
      ok: true,
      status: 'accepted',
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof FirebaseRestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : 'Failed to accept invite.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
