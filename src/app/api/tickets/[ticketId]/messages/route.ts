import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ ticketId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    const { ticketId } = await params;
    if (!ticketId) {
        return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                project: {
                    include: {
                        members: { select: { id: true } },
                    }
                }
            },
        });

        if (!ticket || ticket.project.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        // Access control:
        // owner & admin can access any project in the company.
        // member & client can only access if they are a member of the project.
        if (dbUser.role !== "owner" && dbUser.role !== "admin") {
            const isMember = ticket.project.members.some((m) => m.id === dbUser.id);
            if (!isMember) {
                return NextResponse.json(
                    { error: "Forbidden: You are not a member of this project" },
                    { status: 403 }
                );
            }
        }

        // Fetch messages for the ticket
        const messages = await prisma.message.findMany({
            where: { ticketId, isDeleted: false },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error fetching ticket messages:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ ticketId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    const { ticketId } = await params;
    if (!ticketId) {
        return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                project: {
                    include: {
                        members: { select: { id: true } },
                    }
                }
            },
        });

        if (!ticket || ticket.project.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        // Access control:
        // owner & admin can send message to any project in the company.
        // member & client can only send message if they are a member of the project.
        if (dbUser.role !== "owner" && dbUser.role !== "admin") {
            const isMember = ticket.project.members.some((m) => m.id === dbUser.id);
            if (!isMember) {
                return NextResponse.json(
                    { error: "Forbidden: You are not a member of this project" },
                    { status: 403 }
                );
            }
        }

        const body = await req.json();
        const { text } = body;

        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Message text is required" }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                text: text.trim(),
                projectId: ticket.projectId,
                ticketId,
                userId: user.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        imageUrl: true,
                    },
                },
            },
        });

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error("Error creating ticket message:", error);
        return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }
}
