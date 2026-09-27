const fetch = globalThis.fetch;

async function testResumeApi() {
  const sampleResume = `
  Raj Roy
  Full Stack Developer & Frontend Engineer
  Email: raj.roy@example.com

  PROFESSIONAL SUMMARY
  Full Stack Developer with 4+ years of experience building high-performance web applications using React, Next.js, TypeScript, Node.js, and PostgreSQL.

  TECHNICAL SKILLS
  - Frontend: React, Next.js, TypeScript, Tailwind CSS, Redux, Zustand
  - Backend: Node.js, Express, FastAPI, PostgreSQL, Prisma, Redis, Docker
  - Cloud & Tools: AWS, Git, WebSockets, Jest, CI/CD

  KEY PROJECTS
  1. AI Mock Interview Platform (Mentra)
     - Architected real-time voice and telemetry analysis system with Next.js, WebGL, and OpenAI/Groq AI pipelines.
  2. SmartCampus Analytics Dashboard
     - Engineered high-concurrency real-time telemetry streaming service with PostgreSQL and WebSockets.
  `;

  const res = await fetch("http://localhost:3000/api/resume/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: "RajRoy_DeveloperResume.txt",
      resumeText: sampleResume
    })
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data:", JSON.stringify(data, null, 2));
}

testResumeApi();
