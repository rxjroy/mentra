const fetch = globalThis.fetch;

async function testDefenseInDepth() {
  console.log("=== DEFENSE-IN-DEPTH SECURITY VERIFICATION ===");

  console.log("1. Testing unauthenticated /dashboard access protection...");
  const dashRes = await fetch("http://localhost:3000/dashboard", {
    redirect: "manual"
  });
  console.log("Dashboard response status:", dashRes.status, "Location header:", dashRes.headers.get("location"));

  console.log("2. Testing response security headers...");
  const homeRes = await fetch("http://localhost:3000/");
  console.log("X-Frame-Options:", homeRes.headers.get("x-frame-options"), "(Expected: DENY)");
  console.log("X-Content-Type-Options:", homeRes.headers.get("x-content-type-options"), "(Expected: nosniff)");
  console.log("Referrer-Policy:", homeRes.headers.get("referrer-policy"));
  console.log("Permissions-Policy:", homeRes.headers.get("permissions-policy"));

  console.log("3. Testing malicious file upload rejection on /api/resume/parse...");
  const formData = new FormData();
  const maliciousBlob = new Blob(["malicious payload content"], { type: "application/x-msdownload" });
  formData.append("file", maliciousBlob, "exploit.exe");

  const parseRes = await fetch("http://localhost:3000/api/resume/parse", {
    method: "POST",
    body: formData
  });
  const parseData = await parseRes.json();
  console.log("Executable upload status:", parseRes.status, "(Expected 400)", "Error:", parseData.error);

  console.log("4. Testing valid resume parse format (e.g. .pdf / .txt)...");
  const validFormData = new FormData();
  const validBlob = new Blob(["Senior React and TypeScript developer with 5 years experience."], { type: "text/plain" });
  validFormData.append("file", validBlob, "resume.txt");

  const validRes = await fetch("http://localhost:3000/api/resume/parse", {
    method: "POST",
    body: validFormData
  });
  const validData = await validRes.json();
  console.log("Valid resume parse status:", validRes.status, "Role inferred:", validData.role || validData.profile?.role);

  console.log(">>> DEFENSE-IN-DEPTH SECURITY VERIFICATION COMPLETE <<<");
}

testDefenseInDepth();
