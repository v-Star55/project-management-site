import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/auth";

// ─── POST /api/workspace/create ──────────────────────────────────────────────
// Creates a new company workspace and promotes the authenticated user to "owner".
// The user ID is taken from the verified JWT — NOT from the request body.
export async function POST(request: NextRequest) {
    // Verify token first.
    const authUser = await getCurrentUser(request);
    if (authUser instanceof NextResponse) return authUser;

    try {
        const { name, description, imageUrl } = await request.json();

        if (!name || !description || !imageUrl) {
            return NextResponse.json(
                { error: "name, description, and imageUrl are required" },
                { status: 400 }
            );
        }

        // Create company and update user atomically.
        const workspace = await prisma.company.create({
            data: {
                name,
                description,
                imageUrl,
            },
        });

        await prisma.user.update({
            where: { id: authUser.id },
            data: {
                companyId: workspace.id,
                role: "owner",
            },
        });

        return NextResponse.json({ workspace }, { status: 201 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}