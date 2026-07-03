import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/helpers/permission";
import { ablyRest } from "@/lib/ably";

export const revalidate = 0;

export async function GET(req: NextRequest) {
    // Authenticate the user before generating the token request
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    if (!ablyRest) {
        return NextResponse.json(
            { error: "Ably REST client is not configured. Check ABLY_API in environment variables." },
            { status: 500 }
        );
    }

    try {
        // Generate the token request using user's ID as clientId
        const tokenRequest = await ablyRest.auth.createTokenRequest({
            clientId: user.id,
        });
        return NextResponse.json(tokenRequest);
    } catch (error) {
        console.error("Error generating Ably token request:", error);
        return NextResponse.json(
            { error: "Failed to generate Ably token request" },
            { status: 500 }
        );
    }
}
