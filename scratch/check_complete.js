const fetch = globalThis.fetch;

async function check() {
  const sessionId = "session_1788074050931_9qybblc";
  const compRes = await fetch("http://localhost:3000/api/interview/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId })
  });
  console.log("Status:", compRes.status);
  const text = await compRes.text();
  console.log("Body:", text);
}

check();
