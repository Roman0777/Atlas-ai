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
      <header className="sticky top-0 z-40 border-b border-border/40 glass-strong">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
              AI
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              Atlas<span className="text-primary">.</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm" className="relative">
              <Link to="/board">
                {active === "board" && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-md bg-secondary"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Trophy className="size-4" />
                  Leaderboards
                </span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/jobs">Jobs</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="relative">
              <Link to="/news">
                {active === "news" && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-md bg-secondary"
                  />
                )}
                <span className="relative z-10">News</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/news#newsletter">
                <Mail className="size-4" />
                Newsletter
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="relative">
              <Link to="/network">
                {active === "network" && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-md bg-secondary"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Users className="size-4" />
                  Deals
                </span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/rules">Rules</Link>
            </Button>
            <CreditChip />
            <NotificationBell />
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm" className="relative">
                  <Link to="/dashboard">
                    {active === "dashboard" && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={springSnappy}
                        className="absolute inset-0 rounded-md bg-secondary"
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
