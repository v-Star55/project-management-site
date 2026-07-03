import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/helpers/auth";

export async function POST(request: NextRequest) {
    try {
        const authUser = await getCurrentUser(request);
        if (authUser instanceof NextResponse) return authUser;

        const reqBody = await request.json();
        const { password } = reqBody;

        if (!password || password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        await prisma.user.update({
            where: { id: authUser.id },
            data: {
                password: hashedPassword,
                isPending: false,
            },
        });

        const response = NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
        response.cookies.delete("token");

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
