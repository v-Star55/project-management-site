import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const path = request.nextUrl.pathname;

    const isPublicPath =
        path === "/" || path === "/login" || path === "/signup";

    if (!token) {
        if (!isPublicPath) {
            return NextResponse.redirect(
                new URL("/login", request.url)
            );
        }
        return NextResponse.next();
    }

    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(process.env.JWT_SECRET!)
        );

        if (path === "/dashboard") {
            return NextResponse.redirect(new URL(`/dashboard/${payload.id}`, request.url));
        }

        if (path.startsWith("/dashboard/admin")) {
            if (payload.role !== "admin") {
                return NextResponse.redirect(
                    new URL("/login?message=You are not authorized to access admin panel", request.url)
                );
            }
            if (path === "/dashboard/admin") {
                return NextResponse.redirect(new URL(`/dashboard/admin/${payload.id}`, request.url));
            }
        }

        if (isPublicPath) {
            return NextResponse.redirect(new URL(`/dashboard/${payload.id}`, request.url));
        }


        return NextResponse.next();
    } catch (error) {
        console.log(error, "Jwt Token Invalid");
        const response = NextResponse.redirect(
            new URL("/login", request.url)
        );

        response.cookies.delete("token");

        return response;
    }
}

export const config = {
    matcher: ["/dashboard", "/dashboard/:path*", "/login", "/signup"],
};