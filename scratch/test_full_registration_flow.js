const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function testRegistrationFlow() {
  const timestamp = Date.now();
  const testEmail = `candidate_${timestamp}@gmail.com`;
  const testName = "Sarah Connor";
  const testPassword = "Password123!";

  console.log(`\n1. Requesting Registration OTP for: ${testEmail}`);
  const sendRes = await fetch("http://localhost:3000/api/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
      agreeToTerms: true
    })
  });

  const sendData = await sendRes.json();
  console.log("Send Status:", sendRes.status);
  console.log("Send Response:", sendData);

  if (!sendData.success || !sendData.devCode) {
    console.error("Failed to obtain verification code!");
    return;
  }

  const code = sendData.devCode;
  console.log(`\n2. Verifying OTP Code [${code}] & Registering Account...`);

  const verifyRes = await fetch("http://localhost:3000/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      otp: code
    })
  });

  const verifyData = await verifyRes.json();
  console.log("Verify Status:", verifyRes.status);
  console.log("Verify Response:", verifyData);

  if (verifyRes.ok && verifyData.success) {
    console.log("\n🎉 FULL REGISTRATION FLOW VERIFIED SUCCESSFULLY!");
  } else {
    console.error("\n❌ Registration verification failed!");
  }
}

testRegistrationFlow();
