import { NextRequest, NextResponse } from "next/server";
import { getOtpEmailHtml } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const name = req.nextUrl.searchParams.get("name") || "Alex Rivera";
  const code = req.nextUrl.searchParams.get("code") || "842917";

  const html = getOtpEmailHtml(name, code);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}
