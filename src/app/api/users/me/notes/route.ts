import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

// GET all notes for user
export async function GET(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        const notes = await prisma.note.findMany({
            where: {
                userId: user.id,
                companyId: dbUser.companyId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ notes });
    } catch (error) {
        console.error("Failed to fetch notes:", error);
        return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
}

// POST create note
export async function POST(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        const body = await req.json();
        const { title, description } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const note = await prisma.note.create({
            data: {
                title,
                description: description || null,
                userId: user.id,
                companyId: dbUser.companyId,
            },
        });

        return NextResponse.json({ note }, { status: 201 });
    } catch (error) {
        console.error("Failed to create note:", error);
        return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
}
