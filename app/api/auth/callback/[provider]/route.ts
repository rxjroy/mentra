import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { signJWT, hashPassword, COOKIE_NAME } from "@/lib/auth";
import { Logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    console.warn("OAuth returned error or missing code:", error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error || "OAuth access denied")}`);
  }

  try {
    let email = "";
    let name = "";
    let avatarUrl: string | undefined = undefined;

    // 1. GITHUB OAUTH HANDLER
    if (provider === "github") {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${origin}/login?error=GitHub OAuth credentials not configured`);
      }

      // Exchange code for access token
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: `${origin}/api/auth/callback/github`
        })
      });

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) {
        throw new Error(tokenData.error_description || "Failed to obtain GitHub access token");
      }

      // Fetch user profile
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "Mentra-App" }
      });
      const userData = await userRes.json();
      name = userData.name || userData.login || "GitHub User";
      email = userData.email;
      avatarUrl = userData.avatar_url || undefined;

      // If email is private on GitHub, fetch from user/emails endpoint
      if (!email) {
        const emailsRes = await fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "Mentra-App" }
        });
        const emailsData = await emailsRes.json();
        if (Array.isArray(emailsData)) {
          const primaryEmail = emailsData.find((e: any) => e.primary && e.verified) || emailsData[0];
          email = primaryEmail?.email;
        }
      }

      if (!email) {
        email = `${userData.login}@users.noreply.github.com`;
      }
    }

    // 2. GOOGLE OAUTH HANDLER
    else if (provider === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${origin}/login?error=Google OAuth credentials not configured`);
      }

      // Exchange code for token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: `${origin}/api/auth/callback/google`,
          grant_type: "authorization_code"
        })
      });

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) {
        throw new Error(tokenData.error_description || "Failed to obtain Google access token");
      }

      // Fetch Google User Profile
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userData = await userRes.json();
      email = userData.email;
      name = userData.name || userData.given_name || "Google User";
      avatarUrl = userData.picture || undefined;
    } else {
      return NextResponse.redirect(`${origin}/login?error=Unsupported provider`);
    }

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=Could not retrieve email from ${provider}`);
    }

    // 3. Find or Create User Record in Database
    let user = await Database.findUserByEmail(email);
    if (!user) {
      const randomPasswordHash = await hashPassword(Math.random().toString(36) + Date.now().toString());
      user = await Database.createUser(name, email, randomPasswordHash, avatarUrl);
    } else if (avatarUrl && !user.avatarUrl) {
      user.avatarUrl = avatarUrl;
    }

    // 4. Issue JWT Token Cookie & Redirect to Dashboard
    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: avatarUrl || user.avatarUrl
    });

    Logger.audit("OAuth login successful", { userId: user.id, email: user.email, provider });

    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/"
    });

    return response;
  } catch (err: any) {
    Logger.error("OAuth callback error", err, { provider });
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Authentication failed. Please try again.")}`);
  }
}
