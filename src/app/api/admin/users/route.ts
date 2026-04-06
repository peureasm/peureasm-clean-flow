import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@/app/lib/types';
import {
  FirebaseRestError,
  assertAdminAccess,
  getUserDocument,
  lookupAuthUser,
  patchUserDocument,
} from '@/server/firebase-rest';

type AdminUserAction = 'approve' | 'set-role' | 'set-active';

interface AdminUserUpdateRequest {
  idToken?: string;
  userId?: string;
  action?: AdminUserAction;
  role?: UserRole;
  isActive?: boolean;
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'ADMIN' || value === 'HOSPITAL' || value === 'DRIVER' || value === 'FACTORY';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AdminUserUpdateRequest;
    const idToken = body.idToken?.trim();
    const userId = body.userId?.trim();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing id token.' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing user id.' }, { status: 400 });
    }

    if (
      body.action !== 'approve' &&
      body.action !== 'set-role' &&
      body.action !== 'set-active'
    ) {
      return NextResponse.json({ error: 'Invalid admin action.' }, { status: 400 });
    }

    const authUser = await lookupAuthUser(idToken);
    const callerProfile = await getUserDocument(idToken, authUser.localId);
    assertAdminAccess(authUser, callerProfile);

    const targetUser = await getUserDocument(idToken, userId);

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user was not found.' }, { status: 404 });
    }

    const updatedAt = new Date().toISOString();

    if (body.action === 'set-active') {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'Active status must be a boolean.' },
          { status: 400 }
        );
      }

      const updatedUser = await patchUserDocument(idToken, userId, {
        isActive: body.isActive,
        updatedAt,
      });

      return NextResponse.json({ ok: true, user: updatedUser });
    }

    if (!isUserRole(body.role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    const updatedUser = await patchUserDocument(idToken, userId, {
      role: body.role,
      roleRequested: body.role,
      updatedAt,
    });

    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (error) {
    if (error instanceof FirebaseRestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : 'Failed to update user.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
