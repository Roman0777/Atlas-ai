import { SubmitListingDialog } from "@/components/listing-dialogs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { CreditChip } from "@/components/credit-chip";
import { useAuth } from "@/hooks/use-auth";
import { springSnappy } from "@/lib/motion";
import { LayoutDashboard, LogIn, Trophy, Users } from "lucide-react";
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
      <header className="fixed top-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 sm:top-4 sm:w-[calc(100%-2rem)]">
        <div className="glass flex h-12 items-center justify-between rounded-2xl px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">
              AI
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Atlas<span className="text-primary">.</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="relative text-xs">
              <Link to="/board">
                {active === "board" && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-full bg-secondary"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Trophy className="size-3.5" />
                  <span className="hidden sm:inline">Leaderboards</span>
                </span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/jobs">Jobs</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="relative text-xs">
              <Link to="/news">
                {active === "news" && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-full bg-secondary"
                  />
                )}
                <span className="relative z-10">News</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="relative text-xs">
              <Link to="/network">
                {active === "network" && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-full bg-secondary"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  <span className="hidden sm:inline">Deals</span>
                </span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/rules">Rules</Link>
            </Button>
            <CreditChip />
            <NotificationBell />
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm" className="relative text-xs">
                  <Link to="/dashboard">
                    {active === "dashboard" && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={springSnappy}
                        className="absolute inset-0 rounded-full bg-secondary"
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <LayoutDashboard className="size-3.5" />
                      <span className="hidden sm:inline">My products</span>
                    </span>
                  </Link>
                </Button>
                <Button size="sm" onClick={() => setSubmitOpen(true)} className="rounded-full text-xs">
                  + Submit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  className="text-xs"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button asChild size="sm" className="rounded-full text-xs">
                <Link to="/auth?returnTo=%2Fboard">
                  <LogIn className="size-3.5" />
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
