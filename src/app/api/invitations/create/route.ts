import { NextRequest, NextResponse } from 'next/server';
import {
  FirebaseRestError,
  assertAdminAccess,
  getUserDocument,
  lookupAuthUser,
} from '@/server/firebase-rest';
import { createInviteToken, type InviteRole } from '@/server/invite-tokens';

interface CreateInviteRequest {
  idToken?: string;
  role?: InviteRole;
  hospitalId?: string | null;
  targetUserId?: string | null;
}

function isInviteRole(value: unknown): value is InviteRole {
  return value === 'HOSPITAL' || value === 'DRIVER';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateInviteRequest;
    const idToken = body.idToken?.trim();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing id token.' }, { status: 401 });
    }

    if (!isInviteRole(body.role)) {
      return NextResponse.json({ error: 'Invalid invite role.' }, { status: 400 });
    }

    const authUser = await lookupAuthUser(idToken);
    const callerProfile = await getUserDocument(idToken, authUser.localId);

    let hospitalId: string | null = null;
    let targetUserId: string | null = null;
    let targetEmail: string | null = null;

    if (body.role === 'HOSPITAL') {
      if (callerProfile?.role === 'HOSPITAL') {
        if (!callerProfile.hospitalId) {
          return NextResponse.json(
            { error: 'Hospital account is missing a hospital assignment.' },
            { status: 403 }
          );
        }

        if (body.hospitalId && body.hospitalId !== callerProfile.hospitalId) {
          return NextResponse.json(
            { error: 'Hospital invites can only be created for your own hospital.' },
            { status: 403 }
          );
        }

        hospitalId = callerProfile.hospitalId;
      } else {
        assertAdminAccess(authUser, callerProfile);
        hospitalId = body.hospitalId?.trim() || null;
      }

      if (!hospitalId) {
        return NextResponse.json(
          { error: 'Hospital invite requires a hospital id.' },
          { status: 400 }
        );
      }
    } else {
      assertAdminAccess(authUser, callerProfile);

      targetUserId = body.targetUserId?.trim() || null;
      if (targetUserId) {
        const targetProfile = await getUserDocument(idToken, targetUserId);

        if (!targetProfile || targetProfile.role !== 'DRIVER') {
          return NextResponse.json(
            { error: 'Driver invite requires a valid driver account.' },
            { status: 400 }
          );
        }

        const candidateEmail = targetProfile.username?.trim() || '';
        if (!candidateEmail.includes('@')) {
          return NextResponse.json(
            { error: 'Driver invite requires a driver email address.' },
            { status: 400 }
          );
        }

        targetEmail = candidateEmail.toLowerCase();
      }
    }

    const { token, payload } = createInviteToken({
      role: body.role,
      hospitalId,
      targetUserId,
      targetEmail,
    });

    return NextResponse.json({
      inviteToken: token,
      inviteUrl: `${request.nextUrl.origin}/login?inviteToken=${encodeURIComponent(token)}`,
      expiresAt: payload.expiresAt,
    });
  } catch (error) {
    if (error instanceof FirebaseRestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : 'Failed to create invite link.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
