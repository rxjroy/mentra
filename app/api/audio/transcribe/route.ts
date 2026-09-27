import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    // Rate limit: 40 in dev, 25 in prod per minute per IP
    const rateLimit = checkRateLimit(ip, {
      limit: process.env.NODE_ENV === "development" ? 40 : 25,
      windowMs: 60 * 1000,
      prefix: "audio_trans"
    });

    if (!rateLimit.allowed) {
      Logger.security("Audio transcription rate limit exceeded", { ip });
      return createRateLimitResponse(rateLimit, `Audio transcription rate limit reached. Please wait ${rateLimit.retryAfterSeconds}s.`);
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Limit audio chunk size to 10MB to prevent memory bloat
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio chunk exceeds maximum 10MB limit" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      Logger.error("Groq API key not configured for Whisper transcription");
      return NextResponse.json({ error: "Transcription service unavailable" }, { status: 503 });
    }

    const groqFormData = new FormData();
    groqFormData.append("file", file, "audio.webm");
    groqFormData.append("model", "whisper-large-v3-turbo");
    groqFormData.append("language", "en");
    groqFormData.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`
      },
      body: groqFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      Logger.warn("Groq Whisper API response error", { errorText, status: response.status });
      return NextResponse.json(
        { error: "Failed to transcribe audio" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      text: data.text || ""
    });
  } catch (error: any) {
    Logger.error("Transcription error", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Audio transcription failed") },
      { status: 500 }
    );
  }
}
