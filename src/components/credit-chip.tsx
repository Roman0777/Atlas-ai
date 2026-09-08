import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Coins } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";

/**
 * Header balance chip. Also lazily provisions the wallet (signup bonus) on
 * first authenticated render — idempotent server-side.
 */
export function CreditChip() {
  const { isAuthenticated } = useAuth();
  const wallet = useQuery(api.credits.getWallet);
  const ensureWallet = useMutation(api.credits.ensureWallet);

  useEffect(() => {
    if (isAuthenticated) void ensureWallet();
  }, [isAuthenticated, ensureWallet]);

  if (!isAuthenticated || wallet === undefined || wallet === null) return null;

  return (
    <Link
      to="/credits"
      title={`${wallet.balance.toLocaleString()} credits — open wallet`}
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs",
        "font-medium text-amber-200 transition-colors hover:bg-amber-500/20",
      )}
    >
      <Coins className="size-3.5 text-amber-400" />
      <span className="tabular-nums">{wallet.balance.toLocaleString()}</span>
      {wallet.canClaim && (
        <span
          className="size-1.5 animate-pulse rounded-full bg-emerald-400"
          title="Daily renewal available"
        />
      )}
    </Link>
  );
}
