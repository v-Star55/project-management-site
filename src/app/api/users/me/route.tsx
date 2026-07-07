import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/helpers/auth";

export const dynamic = "force-dynamic";

// ─── GET /api/users/me ───────────────────────────────────────────────────────
// Returns the authenticated user's full profile including their company.
// Uses the shared getCurrentUser helper for consistent token verification.
export async function GET(request: NextRequest): Promise<NextResponse> {
    const authUser = await getCurrentUser(request);

    // Propagate any auth error response.
    if (authUser instanceof NextResponse) return authUser;

    try {
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            include: { company: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userProfile = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            imageUrl: user.imageUrl,
            isPending: user.isPending,
            company: user.company
                ? {
                      id: user.company.id,
                      name: user.company.name,
                      description: user.company.description,
                      imageUrl: user.company.imageUrl,
                  }
                : null,
        };

        return NextResponse.json({ user: userProfile }, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}