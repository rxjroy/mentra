const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const nodemailer = require('nodemailer');

async function testRealSend() {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM || `Mentra <${smtpEmail || "mentrainterview@gmail.com"}>`;

  console.log("From:", from);
  console.log("SMTP user:", smtpEmail);
  console.log("SMTP pass length:", smtpPassword ? smtpPassword.length : 0);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword.replace(/\s+/g, "")
    }
  });

  try {
    const info = await transporter.sendMail({
      from,
      to: smtpEmail, // send to self as a test
      subject: "123456 is your Mentra verification code",
      text: "Test verification code: 123456"
    });
    console.log("Mail sent successfully! ID:", info.messageId);
  } catch (e) {
    console.error("Mail send error:", e);
  }
}

testRealSend();
