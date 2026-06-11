import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, CustomUserPayload } from "@/helpers/auth";

/**
 * Verifies the token AND checks that the authenticated user's role
 * is one of the allowed roles.
 *
 * Returns the typed user payload on success, or a NextResponse error on failure.
 */
export async function requireRole(
    roles: string[],
    request: NextRequest
): Promise<CustomUserPayload | NextResponse> {
    try {
        const user = await getCurrentUser(request);

        // If getCurrentUser returned an error response, propagate it.
        if (user instanceof NextResponse) {
            return user;
        }

        if (!roles.includes(user.role)) {
            return NextResponse.json(
                { error: "Forbidden: insufficient permissions" },
                { status: 403 }
            );
        }

        return user;
    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
