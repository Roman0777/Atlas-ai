import { useState } from "react";
import { X, Database } from "lucide-react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;
const DISMISS_KEY = "vly_backend_banner_dismissed";

function backendLooksUnconfigured(): boolean {
  if (!CONVEX_URL) return true;
  const trimmed = CONVEX_URL.trim();
  // The repo ships no .env — a placeholder must not masquerade as a backend.
  return (
    trimmed.length === 0 ||
    /placeholder/i.test(trimmed) ||
    /^(https?:\/\/)?(your|example)\b/i.test(trimmed)
  );
}

/** Dev-only banner: tells you why data-driven features are static. */
export function DevBackendBanner() {
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(DISMISS_KEY) === "1",
  );
  if (!import.meta.env.DEV) return null;
  if (!backendLooksUnconfigured() || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200 shadow-lg backdrop-blur-md">
        <Database className="size-4 shrink-0 text-amber-300" />
        <p className="max-w-md">
          <span className="font-semibold text-amber-100">
            Convex backend not connected.
          </span>{" "}
          Boards, auth &amp; jobs are static until you run{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 font-mono">
            bun x convex dev
          </code>{" "}
          and log in — it writes the real URL to <code>.env</code>.
        </p>
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          className="shrink-0 rounded-full p-1 text-amber-200/70 transition-colors hover:bg-black/20 hover:text-amber-100"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}