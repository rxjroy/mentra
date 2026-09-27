// Native fetch

async function run() {
  console.log("--- Testing /api/auth/otp/send for new registration ---");
  const testEmail = `testuser_${Date.now()}@example.com`;
  
  try {
    const res = await fetch("http://localhost:3000/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Register User",
        email: testEmail,
        password: "Password123!",
        agreeToTerms: true
      })
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
