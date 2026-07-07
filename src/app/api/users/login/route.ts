import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { email, password, role } = reqBody;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const validPassword = await bcryptjs.compare(password, user.password);

        if (!validPassword) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        const tokenData = {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        }

        const token = jwt.sign(tokenData, process.env.JWT_SECRET!, { expiresIn: "1h" });

         const response = NextResponse.json({ message: "Login successful", user }, { status: 200 });

        response.cookies.set("token", token, { httpOnly: true });
        
        return response;
    } catch (error : any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}