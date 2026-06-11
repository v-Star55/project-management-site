import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export interface CustomUserPayload {
    id: string;
    email: string;
    role: string;
    [key: string]: unknown;
}

/**
 * Extracts and verifies the JWT from the request cookie.
 * Returns the typed user payload on success, or a NextResponse error on failure.
 */
export async function getCurrentUser(
    request: NextRequest
): Promise<CustomUserPayload | NextResponse> {
    try {
        const token = request.cookies.get("token")?.value || "";
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(process.env.JWT_SECRET!)
        );
        return payload as CustomUserPayload;
    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
}