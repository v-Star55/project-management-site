import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, CustomUserPayload } from "@/helpers/auth";
import { prisma } from "@/lib/prisma";

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

        // Fetch fresh role from the database to handle any dynamic role updates (e.g. workspace creation)
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
        });

        if (!dbUser || !roles.includes(dbUser.role)) {
            return NextResponse.json(
                { error: "Forbidden: insufficient permissions" },
                { status: 403 }
            );
        }

        return {
            ...user,
            role: dbUser.role
        };
    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
