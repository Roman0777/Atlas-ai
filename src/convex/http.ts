import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// ---- Standard Webhooks signature verification (Dodo Payments) ----

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function verifyDodoSignature(
  secret: string,
  id: string,
  timestamp: string,
  body: string,
  providedSignatures: string[],
): Promise<boolean> {
  // Secrets look like "whsec_<base64>"; strip the prefix before decoding.
  const secretBytes = base64ToBytes(secret.replace(/^whsec_/, ""));
  const signedContent = `${id}.${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedContent),
  );
  const computed = bytesToBase64(new Uint8Array(sig));
  return providedSignatures.some((s) => s === computed);
}

// Dodo calls this once a payment succeeds; only then does the leaderboard
// move (boost) or drop (paid dislike). Standard Webhooks spec headers:
// webhook-id, webhook-timestamp, webhook-signature.
http.route({
  path: "/webhooks/dodo",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const id = request.headers.get("webhook-id") ?? "";
    const timestamp = request.headers.get("webhook-timestamp") ?? "";
    const signatureHeader = request.headers.get("webhook-signature") ?? "";
    const secret = process.env.DODO_WEBHOOK_SECRET;

    if (!secret || !id || !timestamp || !signatureHeader) {
      return new Response("Webhook not configured", { status: 400 });
    }

    const provided = signatureHeader
      .split(",")
      .map((s) => s.trim().replace(/^v1,/, ""));

    try {
      const valid = await verifyDodoSignature(
        secret,
        id,
        timestamp,
        body,
        provided,
      );
      if (!valid) return new Response("Invalid signature", { status: 401 });
    } catch {
      return new Response("Invalid signature", { status: 401 });
    }

    let event: {
      type?: string;
      data?: { payment_id?: string; metadata?: Record<string, string> };
    };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Bad payload", { status: 400 });
    }

    if (event.type === "payment.succeeded") {
      const meta = event.data?.metadata ?? {};

      // $2 listing fee: create the listing (idempotent on URL).
      if (meta.bidKind === "listing" && meta.title && meta.url && meta.category) {
        try {
          await ctx.runMutation(internal.listings.createPaidListing, {
            userId: meta.userId ?? "",
            title: meta.title,
            url: meta.url,
            tagline: meta.tagline || undefined,
            category: meta.category,
          });
        } catch (err) {
          console.error("Failed to create paid listing:", err);
          return new Response("Apply failed", { status: 500 });
        }
        return new Response(null, { status: 200 });
      }

      const bidId = meta.bidId;
      if (bidId) {
        try {
          await ctx.runMutation(internal.listings.applyPaidBid, {
            bidId: bidId as Id<"bids">,
            paymentId: event.data?.payment_id,
          });
        } catch (err) {
          console.error("Failed to apply paid bid:", err);
          return new Response("Apply failed", { status: 500 });
        }
      }
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
