import { Email } from "@convex-dev/auth/providers/Email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

const FROM_ADDRESS = "Atlas AI <auth@resend.dev>";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      // Local dev convenience: without RESEND_API_KEY we can't email, so log
      // the code to the Convex console for testing. Never silently pretend.
      console.log(
        `[email-otp] No RESEND_API_KEY configured — OTP for ${email} is ${token}`,
      );
      return;
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [email],
          subject: "Your Atlas AI sign-in code",
          html: `
<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto">
  <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#888">Atlas AI</p>
  <h1 style="font-size:20px;margin:8px 0">Your sign-in code</h1>
  <p style="font-size:14px;color:#444;line-height:1.6">
    Enter this code to finish signing in. It expires in 15 minutes.
  </p>
  <p style="font-size:32px;font-weight:700;letter-spacing:.2em;margin:24px 0;color:#132A2E">
    ${token}
  </p>
  <p style="font-size:11px;color:#999">Didn't request this? You can safely ignore this email.</p>
</div>`,
        }),
      });
      if (!res.ok) {
        throw new Error(`Resend error ${res.status}: ${await res.text()}`);
      }
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
