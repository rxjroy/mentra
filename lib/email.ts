import nodemailer from "nodemailer";

export interface SendOtpEmailParams {
  to: string;
  name: string;
  code: string;
  purpose?: "verification" | "login_2fa" | "password_reset";
}

export function getOtpEmailHtml(
  name: string,
  code: string,
  purpose: "verification" | "login_2fa" | "password_reset" = "verification"
): string {
  const safeName = name?.trim() || "Candidate";
  const cleanCode = (code || "123456").replace(/\D/g, "").padEnd(6, "0").slice(0, 6);
  const digits = cleanCode.split("");

  let title = "Confirm your email address";
  let subtitle = `Hi <strong style="color: #FFFFFF; font-weight: 600;">${safeName}</strong>, enter this single-use code to authenticate your account and unlock your permanent telemetry vault.`;
  let badgeLabel = "AUTH SECURE";

  if (purpose === "login_2fa") {
    title = "Two-Factor Authentication";
    subtitle = `Hi <strong style="color: #FFFFFF; font-weight: 600;">${safeName}</strong>, enter this 6-digit security code to verify your identity and complete sign-in.`;
    badgeLabel = "2FA VERIFIED";
  } else if (purpose === "password_reset") {
    title = "Reset your account password";
    subtitle = `Hi <strong style="color: #FFFFFF; font-weight: 600;">${safeName}</strong>, enter this 6-digit verification code to reset your account password and restore vault access.`;
    badgeLabel = "SECURITY RESET";
  }

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mentra Security Code</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style type="text/css">
    body, table, td, p, a, span {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }
    a {
      color: rgba(255, 255, 255, 0.75);
      text-decoration: none;
      transition: color 0.2s ease;
    }
    a:hover {
      color: #FFFFFF !important;
      text-decoration: underline !important;
    }
    @media only screen and (max-width: 600px) {
      .card-table { width: 100% !important; border-radius: 20px !important; }
      .content-cell { padding: 32px 20px !important; }
      .digit-box { width: 42px !important; height: 54px !important; font-size: 26px !important; }
      .footer-cell { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: transparent; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; color: #FFFFFF;">
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: transparent; padding: 30px 10px;">
    <tr>
      <td align="center" style="background-color: transparent;">
        
        <!-- Floating Central Obsidian Card -->
        <table class="card-table" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #080808; border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 28px; overflow: hidden; box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6);">
          
          <!-- Top Header Section with Status Beacon -->
          <tr>
            <td align="center" style="padding: 36px 36px 0 36px;">
              
              <!-- Brand Header Bar -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" valign="middle">
                    <span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF; font-family: 'Outfit', sans-serif;">
                      Mentra<span style="color: #FFFFFF; text-shadow: 0 0 14px rgba(255, 255, 255, 0.95);">.</span>
                    </span>
                  </td>
                  <td align="right" valign="middle">
                    <!-- Session Status Pill -->
                    <table border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 100px; padding: 4px 12px;">
                      <tr>
                        <td valign="middle" style="padding-right: 6px;">
                          <div style="width: 6px; height: 6px; background-color: #34D399; border-radius: 50%;"></div>
                        </td>
                        <td valign="middle">
                          <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255, 255, 255, 0.75); font-family: 'Outfit', sans-serif;">
                            ${badgeLabel}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Header Hairline Divider -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 22px;">
                <tr>
                  <td style="border-top: 1px solid rgba(255, 255, 255, 0.08);"></td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td class="content-cell" align="center" style="padding: 28px 36px 28px 36px;">
              
              <!-- Greeting & Headline -->
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.25; font-family: 'Outfit', sans-serif;">
                ${title}
              </h1>
              
              <p style="margin: 10px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.6); line-height: 1.6; max-width: 420px; font-family: 'Outfit', sans-serif; font-weight: 300;">
                ${subtitle}
              </p>

              <!-- 6 Individual Luxury PIN Cells in Outfit Font -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px; margin-bottom: 24px;">
                <tr>
                  ${digits.map((d, index) => `
                    <td align="center" valign="middle" style="padding: 0 4px;">
                      <table class="digit-box" width="50" height="60" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 12px; box-shadow: 0 0 16px rgba(255, 255, 255, 0.05);">
                        <tr>
                          <td align="center" valign="middle" style="font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800; color: #FFFFFF; text-shadow: 0 0 14px rgba(255, 255, 255, 0.5); line-height: 1;">
                            ${d}
                          </td>
                        </tr>
                      </table>
                    </td>
                  `).join("")}
                </tr>
              </table>

              <!-- Security & Validity Info Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 12px 16px; margin-bottom: 26px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.55); line-height: 1.4; font-family: 'Outfit', sans-serif;">
                      This security code expires in <strong style="color: #FFFFFF;">10 minutes</strong>. Never share this code with anyone.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Hairline Section Divider -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                <tr>
                  <td style="border-top: 1px solid rgba(255, 255, 255, 0.08);"></td>
                </tr>
              </table>

              <!-- Feature Highlights / Security Badges -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: left;">
                <tr>
                  <td colspan="2" style="padding-bottom: 12px;">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255, 255, 255, 0.4); font-family: 'Outfit', sans-serif;">
                      Encrypted Candidate Security
                    </span>
                  </td>
                </tr>
                
                <!-- Feature 1: 01 Badge -->
                <tr>
                  <td width="38" valign="top" style="padding: 6px 0;">
                    <table width="28" height="28" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 8px;">
                      <tr>
                        <td align="center" valign="middle" style="font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 800; color: #FFFFFF; line-height: 1;">
                          01
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="top" style="padding: 4px 0 10px 8px;">
                    <p style="margin: 0; font-size: 13px; color: #FFFFFF; font-weight: 600; font-family: 'Outfit', sans-serif;">
                      Zero-Trust Authentication
                    </p>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.45); line-height: 1.4; font-family: 'Outfit', sans-serif;">
                      Time-based cryptographic single-use PINs protect against unauthorized account breaches.
                    </p>
                  </td>
                </tr>

                <!-- Feature 2: 02 Badge -->
                <tr>
                  <td width="38" valign="top" style="padding: 6px 0;">
                    <table width="28" height="28" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 8px;">
                      <tr>
                        <td align="center" valign="middle" style="font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 800; color: #FFFFFF; line-height: 1;">
                          02
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="top" style="padding: 4px 0 10px 8px;">
                    <p style="margin: 0; font-size: 13px; color: #FFFFFF; font-weight: 600; font-family: 'Outfit', sans-serif;">
                      Historical Vault Persistence
                    </p>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.45); line-height: 1.4; font-family: 'Outfit', sans-serif;">
                      All rubric telemetry, questions, and audio recordings remain strictly isolated to your verified identity.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Rich Detailed Footer Section -->
          <tr>
            <td class="footer-cell" style="border-top: 1px solid rgba(255, 255, 255, 0.08); background-color: #050505; padding: 28px 36px; text-align: center;">
              
              <!-- Quick Navigation Links -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 18px;">
                <tr>
                  <td align="center">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                      <a href="http://localhost:3000/dashboard" style="color: rgba(255, 255, 255, 0.6); padding: 0 8px;">Dashboard</a>
                      <span style="color: rgba(255, 255, 255, 0.2);">•</span>
                      <a href="http://localhost:3000/privacy" style="color: rgba(255, 255, 255, 0.6); padding: 0 8px;">Privacy Policy</a>
                      <span style="color: rgba(255, 255, 255, 0.2);">•</span>
                      <a href="http://localhost:3000/terms" style="color: rgba(255, 255, 255, 0.6); padding: 0 8px;">Terms of Service</a>
                      <span style="color: rgba(255, 255, 255, 0.2);">•</span>
                      <a href="mailto:mentrainterview@gmail.com" style="color: rgba(255, 255, 255, 0.6); padding: 0 8px;">Support</a>
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Security Disclosure Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 12px 14px; margin-bottom: 18px; text-align: left;">
                <tr>
                  <td valign="middle" style="font-size: 11px; color: rgba(255, 255, 255, 0.4); line-height: 1.5; font-family: 'Outfit', sans-serif;">
                    <strong style="color: rgba(255, 255, 255, 0.7);">Security Notice:</strong> You received this transactional email because an authentication or password security request was initiated for this account. If you did not make this request, please secure your account immediately.
                  </td>
                </tr>
              </table>

              <!-- Crafted with love pill badge -->
              <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 14px auto; background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 100px; padding: 4px 14px;">
                <tr>
                  <td align="center">
                    <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255, 255, 255, 0.5);">
                      Crafted with <span style="color: #FFFFFF;">❤</span> by Mentra Intelligence
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Copyright & Legal Line -->
              <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.25); line-height: 1.5; font-family: 'Outfit', sans-serif;">
                © 2026 Mentra Inc. • Autonomous Adaptive Role Simulation & Career Intelligence.<br />
                All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getOtpEmailPlainText(
  name: string,
  code: string,
  purpose: "verification" | "login_2fa" | "password_reset" = "verification"
): string {
  const safeName = name?.trim() || "Candidate";
  const cleanCode = (code || "123456").replace(/\D/g, "").padEnd(6, "0").slice(0, 6);

  if (purpose === "login_2fa") {
    return `Hi ${safeName},\n\nYour Mentra Two-Factor Authentication security code is: ${cleanCode}\n\nThis single-use code expires in 10 minutes. If you did not request this code, please secure your account immediately.\n\n— The Mentra Intelligence Team\nhttps://mentra.ai`;
  } else if (purpose === "password_reset") {
    return `Hi ${safeName},\n\nYour Mentra password reset code is: ${cleanCode}\n\nThis single-use code expires in 10 minutes. If you did not request a password reset, you can safely ignore this email.\n\n— The Mentra Intelligence Team\nhttps://mentra.ai`;
  }

  return `Hi ${safeName},\n\nYour Mentra email verification code is: ${cleanCode}\n\nThis single-use code expires in 10 minutes. Enter this code to verify your account and unlock your permanent telemetry vault.\n\n— The Mentra Intelligence Team\nhttps://mentra.ai`;
}

export async function sendOtpEmail({
  to,
  name,
  code,
  purpose = "verification"
}: SendOtpEmailParams): Promise<{ success: boolean; error?: string }> {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM || `Mentra Security <${smtpEmail || "mentrainterview@gmail.com"}>`;
  const replyTo = smtpEmail || "mentrainterview@gmail.com";

  const htmlContent = getOtpEmailHtml(name, code, purpose);
  const textContent = getOtpEmailPlainText(name, code, purpose);

  let subject = `${code} is your Mentra verification code`;
  if (purpose === "login_2fa") {
    subject = `${code} is your Mentra sign-in security code`;
  } else if (purpose === "password_reset") {
    subject = `${code} is your Mentra password reset code`;
  }

  // 1. Primary: Direct Gmail SMTP Transporter (Sends to ANY email worldwide, 100% free)
  if (smtpEmail && smtpPassword) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpEmail,
          pass: smtpPassword.replace(/\s+/g, "")
        }
      });

      const info = await transporter.sendMail({
        from,
        to,
        replyTo,
        subject,
        text: textContent,
        html: htmlContent,
        headers: {
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
          "Importance": "high",
          "X-Auto-Response-Suppress": "All",
          "Auto-Submitted": "auto-generated"
        }
      });

      console.log(`✉️ Email successfully dispatched via Gmail SMTP to ${to} (ID: ${info.messageId})`);
      return { success: true };
    } catch (smtpErr: any) {
      console.error("Gmail SMTP error:", smtpErr);
    }
  }

  // 2. Fallback: Resend API (if configured)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: "Mentra <onboarding@resend.dev>",
          to: [to],
          reply_to: replyTo,
          subject,
          text: textContent,
          html: htmlContent
        })
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`✉️ Email dispatched via Resend to ${to} (ID: ${data.id})`);
        return { success: true };
      }
    } catch (resendErr: any) {
      console.error("Resend fallback error:", resendErr);
    }
  }

  return { success: false, error: "No active email provider succeeded." };
}
