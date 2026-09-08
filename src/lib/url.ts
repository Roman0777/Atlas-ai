const TRACKING_PARAM_PATTERNS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^dclid$/i,
  /^msclkid$/i,
  /^mc_[ei]id$/i,
  /^igsh/i,
  /^si$/i, // youtube share tracking
  /^ref(_src)?$/i,
  /^referrer$/i,
  /^_hsenc$/i,
  /^_hsmi$/i,
  /^vero_[a-z]+$/i,
];

// Chat/invite links are blocked to keep the board spam-free (outbid.lol rules).
const BLOCKED_HOST_SUFFIXES = [
  "discord.gg",
  "chat.whatsapp.com",
  "t.me",
  "telegram.me",
  "m.me",
  "wa.me",
];

export type SanitizeResult =
  | { ok: true; url: string; hostname: string }
  | { ok: false; error: string };

export function sanitizeUrl(raw: string): SanitizeResult {
  let input = raw.trim();
  if (!input) return { ok: false, error: "URL is required." };

  // outbid.lol: accept X/Twitter handles as a valid listing type.
  // "@username" or bare "username" → stored as https://x.com/username
  const handleMatch = input.match(/^@?([A-Za-z0-9_]{1,15})$/);
  if (handleMatch) {
    const handle = handleMatch[1];
    return {
      ok: true,
      url: `https://x.com/${handle}`,
      hostname: "x.com",
    };
  }

  // Normalize bare x.com/twitter.com handles to a clean URL.
  const xHandleMatch = input.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})$/i,
  );
  if (xHandleMatch) {
    const handle = xHandleMatch[1];
    return {
      ok: true,
      url: `https://x.com/${handle}`,
      hostname: "x.com",
    };
  }

  // Normalize Instagram profile URLs.
  const igMatch = input.match(
    /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{1,30})\/?$/i,
  );
  if (igMatch) {
    return { ok: true, url: `https://www.instagram.com/${igMatch[1]}/`, hostname: "www.instagram.com" };
  }

  // Normalize YouTube channel URLs.
  const ytMatch = input.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(@[A-Za-z0-9_-]{1,30})|youtu\.be\/([A-Za-z0-9_-]{1,30}))$/i,
  );
  if (ytMatch) {
    const handle = ytMatch[1] || `@${ytMatch[2]}`;
    return { ok: true, url: `https://www.youtube.com/${handle}`, hostname: "www.youtube.com" };
  }

  // Normalize TikTok profile URLs.
  const ttMatch = input.match(
    /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([A-Za-z0-9_.]{1,24})$/i,
  );
  if (ttMatch) {
    return { ok: true, url: `https://www.tiktok.com/@${ttMatch[1]}`, hostname: "www.tiktok.com" };
  }

  // Normalize LinkedIn profile URLs.
  const liMatch = input.match(
    /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([A-Za-z0-9_-]{1,100})\/?$/i,
  );
  if (liMatch) {
    return { ok: true, url: `https://www.linkedin.com/in/${liMatch[1]}/`, hostname: "www.linkedin.com" };
  }

  // Normalize Twitch channel URLs.
  const twMatch = input.match(
    /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([A-Za-z0-9_]{1,25})$/i,
  );
  if (twMatch) {
    return { ok: true, url: `https://www.twitch.tv/${twMatch[1]}`, hostname: "www.twitch.tv" };
  }

  // Normalize Substack/newsletter URLs.
  const subMatch = input.match(
    /^(?:https?:\/\/)?([A-Za-z0-9_-]+)\.substack\.com\/?$/i,
  );
  if (subMatch) {
    return { ok: true, url: `https://${subMatch[1]}.substack.com/`, hostname: `${subMatch[1]}.substack.com` };
  }

  if (!/^https?:\/\//i.test(input)) input = `https://${input}`;

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http(s) links are allowed." };
  }
  if (!parsed.hostname.includes(".") || parsed.hostname.endsWith(".")) {
    return { ok: false, error: "Enter a full domain, e.g. example.com." };
  }
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOST_SUFFIXES.some((b) => host === b || host.endsWith(`.${b}`))) {
    return {
      ok: false,
      error: "Chat / invite links aren't allowed on the board.",
    };
  }

  // Strip tracking params so the board stays clean and screenshot-friendly.
  const params = [...parsed.searchParams.keys()];
  for (const key of params) {
    if (TRACKING_PARAM_PATTERNS.some((p) => p.test(key))) {
      parsed.searchParams.delete(key);
    }
  }
  parsed.hash = "";

  return { ok: true, url: parsed.toString(), hostname: parsed.hostname };
}
