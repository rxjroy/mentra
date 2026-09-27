const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const nodemailer = require('nodemailer');

async function testMail() {
  console.log("SMTP_EMAIL:", process.env.SMTP_EMAIL ? process.env.SMTP_EMAIL : "MISSING");
  console.log("SMTP_PASSWORD exists:", Boolean(process.env.SMTP_PASSWORD));

  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    console.log("No SMTP configured!");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword.replace(/\s+/g, "")
    }
  });

  try {
    const verified = await transporter.verify();
    console.log("Transporter verification:", verified);
  } catch (e) {
    console.error("Transporter verify error:", e);
  }
}

testMail();
