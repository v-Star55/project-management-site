import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

interface Params {
    params: Promise<{
        noteId: string;
    }>;
}

// PATCH update note
export async function PATCH(req: NextRequest, { params }: Params) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    try {
        const { noteId } = await params;
        const body = await req.json();
        const { title, description, isCompleted } = body;

        // Verify ownership
        const note = await prisma.note.findUnique({
            where: { id: noteId },
        });

        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        if (note.userId !== user.id) {
            return NextResponse.json({ error: "Unauthorized access to note" }, { status: 403 });
        }

        const updatedNote = await prisma.note.update({
            where: { id: noteId },
            data: {
                ...(title !== undefined ? { title } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(isCompleted !== undefined ? { isCompleted } : {}),
            },
        });

        return NextResponse.json({ note: updatedNote });
    } catch (error) {
        console.error("Failed to update note:", error);
        return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
    }
}

// DELETE note
export async function DELETE(req: NextRequest, { params }: Params) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    try {
        const { noteId } = await params;

        // Verify ownership
        const note = await prisma.note.findUnique({
            where: { id: noteId },
        });

        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        if (note.userId !== user.id) {
            return NextResponse.json({ error: "Unauthorized access to note" }, { status: 403 });
        }

        await prisma.note.delete({
            where: { id: noteId },
        });

        return NextResponse.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Failed to delete note:", error);
        return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }
}
