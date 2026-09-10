import { SubmitListingDialog } from "@/components/listing-dialogs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { CreditChip } from "@/components/credit-chip";
import { useAuth } from "@/hooks/use-auth";
import { springSnappy } from "@/lib/motion";
import { LayoutDashboard, LogIn, Mail, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router";

export function SiteHeader({
  active,
}: {
  active?: "board" | "dashboard" | "credits" | "network" | "news";
}) {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [submitOpen, setSubmitOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 glass-strong shadow-[0_1px_0_color-mix(in_oklab,var(--border)_55%,transparent),0_12px_32px_-20px_oklch(0.2_0.04_175/0.25)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background shadow-[0_4px_12px_-4px_oklch(0.2_0.04_175/0.5)]">
              AI
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              Atlas<span className="text-primary">.</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="relative rounded-full px-3.5">
              <Link to="/board">
                {active === "board" && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-full bg-secondary shadow-[inset_0_1px_2px_oklch(0.2_0.04_175/0.12)]"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Trophy className="size-4" />
                  Leaderboards
                </span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full px-3.5">
              <Link to="/jobs">Jobs</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="relative rounded-full px-3.5">
              <Link to="/news">
                {active === "news" && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-full bg-secondary shadow-[inset_0_1px_2px_oklch(0.2_0.04_175/0.12)]"
                  />
                )}
                <span className="relative z-10">News</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full px-3.5">
              <Link to="/news#newsletter">
                <Mail className="size-4" />
                Newsletter
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="relative rounded-full px-3.5">
              <Link to="/network">
                {active === "network" && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-full bg-secondary shadow-[inset_0_1px_2px_oklch(0.2_0.04_175/0.12)]"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Users className="size-4" />
                  Deals
                </span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full px-3.5">
              <Link to="/rules">Rules</Link>
            </Button>
            <CreditChip />
            <NotificationBell />
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm" className="relative rounded-full px-3.5">
                  <Link to="/dashboard">
                    {active === "dashboard" && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={springSnappy}
                        className="absolute inset-0 rounded-full bg-secondary shadow-[inset_0_1px_2px_oklch(0.2_0.04_175/0.12)]"
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <LayoutDashboard className="size-4" />
                      My products
                    </span>
                  </Link>
                </Button>
                <Button size="sm" onClick={() => setSubmitOpen(true)}>
                  + Submit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth?returnTo=%2Fboard">
                  <LogIn className="size-4" />
                  Sign in
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      <SubmitListingDialog open={submitOpen} onOpenChange={setSubmitOpen} />
    </>
  );
}
