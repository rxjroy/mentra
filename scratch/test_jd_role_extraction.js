const fetch = globalThis.fetch;

async function testJdRoleExtraction() {
  const sampleJd = `
  About Stripe:
  Stripe is building the financial infrastructure for the internet.
  We are hiring a Senior Distributed Systems Engineer to lead our real-time payment ledger replication engine.
  Requirements: 5+ years of experience with Go, Rust, distributed databases, Raft/Paxos consensus, and high-throughput systems.
  `;

  console.log("1. Generating interview session with role & company omitted from form fields...");
  const res = await fetch("http://localhost:3000/api/interview/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobDescription: sampleJd,
      experienceLevel: "senior",
      mode: "full"
    })
  });

  const data = await res.json();
  console.log("Generated Session Role:", data.session?.role);
  console.log("Generated Session Company:", data.session?.company);
}

testJdRoleExtraction();
