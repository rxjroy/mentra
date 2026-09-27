const fetch = globalThis.fetch;

async function runSecurityAudit() {
  console.log("=== MULTI-TENANT SECURITY AUDIT ===");

  const userA_email = `candidate_a_${Date.now()}@example.com`;
  const userB_email = `candidate_b_${Date.now()}@example.com`;
  const password = "Password123!";

  // Helper to register & login with real valid JWT
  async function registerUser(name, email) {
    const regRes = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, agreeToTerms: true })
    });
    
    const setCookie = regRes.headers.get("set-cookie");
    const match = setCookie ? setCookie.match(/mentra_token=([^;]+)/) : null;
    const token = match ? match[1] : null;

    return `mentra_token=${token}`;
  }

  console.log("1. Registering Candidate A...");
  const cookieA = await registerUser("Candidate Alpha", userA_email);
  console.log("Candidate A Auth Cookie extracted:", !!cookieA);

  console.log("2. Registering Candidate B...");
  const cookieB = await registerUser("Candidate Beta", userB_email);
  console.log("Candidate B Auth Cookie extracted:", !!cookieB);

  console.log("3. Candidate A creates an interview session...");
  const genRes = await fetch("http://localhost:3000/api/interview/generate", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookieA
    },
    body: JSON.stringify({
      jobDescription: "Senior Distributed Systems Engineer at Stripe",
      mode: "full"
    })
  });
  const genData = await genRes.json();
  const sessionA_Id = genData.sessionId;
  console.log("Candidate A Session ID:", sessionA_Id, "User ID bound:", genData.session.userId);

  console.log("4. Candidate B attempts to GET Candidate A's session...");
  const getAttempt = await fetch(`http://localhost:3000/api/interview/session/${sessionA_Id}`, {
    headers: { "Cookie": cookieB }
  });
  console.log("Cross-tenant GET session Status:", getAttempt.status, "(Expected 403)");
  const getAttemptData = await getAttempt.json();
  console.log("Cross-tenant GET Error Msg:", getAttemptData.error);

  console.log("5. Candidate B attempts to POST answers to Candidate A's session...");
  const scoreAttempt = await fetch("http://localhost:3000/api/interview/score", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookieB
    },
    body: JSON.stringify({
      sessionId: sessionA_Id,
      questionId: genData.session.questions[0].id,
      answerText: "Malicious cross-tenant answer submission attempt"
    })
  });
  console.log("Cross-tenant POST score Status:", scoreAttempt.status, "(Expected 403)");

  console.log("6. Candidate B attempts to complete Candidate A's session...");
  const completeAttempt = await fetch("http://localhost:3000/api/interview/complete", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookieB
    },
    body: JSON.stringify({ sessionId: sessionA_Id })
  });
  console.log("Cross-tenant POST complete Status:", completeAttempt.status, "(Expected 403)");

  console.log("7. Candidate B attempts to hijack/migrate Candidate A's session...");
  const migrateAttempt = await fetch("http://localhost:3000/api/interview/migrate", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookieB
    },
    body: JSON.stringify({ sessionId: sessionA_Id })
  });
  console.log("Cross-tenant POST migrate Status:", migrateAttempt.status, "(Expected 403)");

  console.log("8. Checking Candidate B's dashboard stats...");
  const statsB = await fetch("http://localhost:3000/api/dashboard/stats", {
    headers: { "Cookie": cookieB }
  });
  const statsBData = await statsB.json();
  console.log("Candidate B Total Sessions in Vault:", statsBData.stats.sessions.length, "(Expected 0)");

  console.log("9. Candidate A accesses their own session...");
  const getOwn = await fetch(`http://localhost:3000/api/interview/session/${sessionA_Id}`, {
    headers: { "Cookie": cookieA }
  });
  console.log("Candidate A access own session Status:", getOwn.status, "(Expected 200)");

  if (getAttempt.status === 403 && scoreAttempt.status === 403 && completeAttempt.status === 403 && migrateAttempt.status === 403 && statsBData.stats.sessions.length === 0 && getOwn.status === 200) {
    console.log(">>> ALL MULTI-TENANT ISOLATION TESTS PASSED 100% <<<");
  } else {
    console.error(">>> MULTI-TENANT ISOLATION TEST FAILED <<<");
  }
}

runSecurityAudit();
