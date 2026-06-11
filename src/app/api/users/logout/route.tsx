import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response:NextResponse = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 }
    );

    response.cookies.delete("token");

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}