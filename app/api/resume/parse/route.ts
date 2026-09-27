import { NextRequest, NextResponse } from "next/server";
import { AiEngine } from "@/lib/ai/provider";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";

async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<string> {
  const lower = (fileName || "").toLowerCase();

  // 1. PDF Documents (Extract actual text streams using unpdf)
  if (lower.endsWith(".pdf")) {
    try {
      const { extractText } = await import("unpdf");
      const result = await extractText(new Uint8Array(buffer));
      const text = Array.isArray(result.text) ? result.text.join("\n") : (result.text || "");
      if (text && text.trim().length > 15) {
        return text.replace(/[\r\n]+/g, "\n").trim();
      }
    } catch (pdfErr) {
      console.warn("unpdf text extraction error:", pdfErr);
    }
  }

  // 2. Word Documents (.docx / .doc using mammoth)
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 15) {
        return result.value.replace(/[\r\n]+/g, "\n").trim();
      }
    } catch (docxErr) {
      console.warn("mammoth docx extraction error:", docxErr);
    }
  }

  // 3. Plain Text / Markdown / JSON / ASCII fallback
  try {
    const raw = buffer.toString("utf-8");
    return raw.replace(/[\r\n]+/g, "\n").trim();
  } catch (e) {
    return buffer.toString("ascii").slice(0, 4000);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate limit: 20 in dev, 10 in prod per 5 min per IP
    const rateLimit = checkRateLimit(ip, {
      limit: process.env.NODE_ENV === "development" ? 25 : 10,
      windowMs: 5 * 60 * 1000,
      prefix: "resume_parse"
    });

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, `Resume parsing limit reached. Please wait ${rateLimit.retryAfterSeconds}s.`);
    }

    let resumeText = "";
    let fileName = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
      }

      // Max 5MB file size limit to prevent memory exhaustion
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File size exceeds 5MB limit." }, { status: 400 });
      }

      fileName = file.name;
      const lowerName = fileName.toLowerCase();
      const allowedExtensions = [".pdf", ".docx", ".doc", ".txt", ".md", ".rtf", ".json"];
      const isAllowed = allowedExtensions.some(ext => lowerName.endsWith(ext));

      if (!isAllowed) {
        return NextResponse.json(
          { error: "Invalid file format. Please upload a PDF, DOCX, DOC, TXT, or MD resume file." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      resumeText = await extractTextFromBuffer(buffer, fileName);
    } else {
      const body = await req.json();
      resumeText = body.resumeText || "";
      fileName = body.fileName || "resume.txt";
    }

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 15) {
      return NextResponse.json(
        { error: "Could not extract sufficient text from the resume." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert executive recruiter and technical resume analyzer.
Extract the candidate's core attributes, technologies, projects, and work history from their resume text.

Return STRICTLY a JSON object with this schema:
{
  "role": "Target or current role title (e.g. Frontend Engineer, Full Stack Developer)",
  "seniority": "Fresher | Junior | Mid | Senior | Lead",
  "skills": ["React", "TypeScript", "FastAPI", "PostgreSQL", "Docker"],
  "pastCompanies": ["Company or University Name"],
  "keyProjects": ["SmartCampus AI Assistant", "E-commerce dashboard"],
  "summary": "2-sentence executive summary highlighting candidate's key project accomplishments and skills"
}`;

    const parsedData = await AiEngine.generateJson<{
      role: string;
      seniority: string;
      skills: string[];
      pastCompanies: string[];
      keyProjects: string[];
      summary: string;
    }>(systemPrompt, `Resume text (${fileName}):\n${resumeText.slice(0, 4000)}`);

    return NextResponse.json({
      success: true,
      profile: parsedData,
      resumeText: resumeText.slice(0, 4000)
    });
  } catch (error: any) {
    console.error("Resume parsing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse resume text" },
      { status: 500 }
    );
  }
}
