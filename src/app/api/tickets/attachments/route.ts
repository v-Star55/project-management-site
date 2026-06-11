import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";
import fs from "fs/promises";
import path from "path";

// POST /api/tickets/attachments
// Supports multipart/form-data for file uploads OR application/json for link attachments
export async function POST(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member"], req);
    if (user instanceof NextResponse) return user;

    try {
        const contentType = req.headers.get("content-type") || "";
        let ticketId = "";
        let fileName = "";
        let fileUrl = "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file") as File | null;
            ticketId = formData.get("ticketId") as string;

            if (!ticketId) {
                return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
            }

            if (file && file.size > 0) {
                fileName = file.name;
                
                // Ensure uploads directory exists
                const uploadsDir = path.join(process.cwd(), "public", "uploads");
                await fs.mkdir(uploadsDir, { recursive: true });

                // Generate a safe unique filename to avoid overwrites
                const fileExtension = path.extname(file.name);
                const baseName = path.basename(file.name, fileExtension);
                const uniqueFileName = `${baseName.replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}${fileExtension}`;
                const filePath = path.join(uploadsDir, uniqueFileName);

                // Write the file buffer
                const buffer = Buffer.from(await file.arrayBuffer());
                await fs.writeFile(filePath, buffer);

                fileUrl = `/uploads/${uniqueFileName}`;
            } else {
                fileName = (formData.get("fileName") as string) || "";
                fileUrl = (formData.get("fileUrl") as string) || "";
            }
        } else {
            const body = await req.json();
            ticketId = body.ticketId;
            fileName = body.fileName;
            fileUrl = body.fileUrl;
        }

        if (!ticketId || !fileName || !fileUrl) {
            return NextResponse.json(
                { error: "ticketId, fileName, and fileUrl are required" },
                { status: 400 }
            );
        }

        // Verify ticket and permissions
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { companyId: true },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { project: true },
        });

        if (!ticket || ticket.project.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Ticket not found or unauthorized" }, { status: 403 });
        }

        const attachment = await prisma.ticketAttachment.create({
            data: {
                ticketId,
                fileName,
                fileUrl,
            },
        });

        return NextResponse.json({ attachment }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create attachment" }, { status: 500 });
    }
}

// DELETE /api/tickets/attachments?id=xxx
export async function DELETE(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member"], req);
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "attachment id is required" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { companyId: true },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        const attachment = await prisma.ticketAttachment.findUnique({
            where: { id },
            include: { ticket: { include: { project: true } } },
        });

        if (!attachment || attachment.ticket.project.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Attachment not found or unauthorized" }, { status: 403 });
        }

        // Delete physical file if locally uploaded
        if (attachment.fileUrl.startsWith("/uploads/")) {
            const filePath = path.join(process.cwd(), "public", attachment.fileUrl);
            try {
                await fs.unlink(filePath);
            } catch (err) {
                console.error("Failed to delete physical file", err);
            }
        }

        await prisma.ticketAttachment.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
    }
}
