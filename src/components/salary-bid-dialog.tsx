import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  DollarSign,
  Gavel,
  MessageSquare,
  PenLine,
  Rocket,
  Sparkles,
  Trophy,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type JobBid = {
  _id: string;
  jobId: string;
  userId: string;
  userName: string;
  desiredSalary: number;
  message?: string;
  yearsExp?: number;
  skills?: string[];
  isBoosted?: boolean;
  boostCents?: number;
  createdAt: number;
};

/**
 * Salary bid dialog — shows all bids for a job and lets the user place their own.
 * Inspired by salarybid.lol: candidates bid their desired salary, employers pick.
 */
export function SalaryBidDialog({
  jobId,
  jobTitle,
  companyName,
  isOpen,
  onClose,
}: {
  jobId: string;
  jobTitle: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const bids = useQuery(
    api.salaryBids.getBidsForJob,
    isOpen ? { jobId: jobId as Id<"jobListings"> } : "skip",
  );
  const placeBid = useMutation(api.salaryBids.placeBid);

  const [salary, setSalary] = useState("");
  const [message, setMessage] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [skills, setSkills] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleBid = async () => {
    const num = parseInt(salary.replace(/[^0-9]/g, ""));
    if (!num || num < 10000) {
      toast.error("Enter a valid salary (min $10,000/year).");
      return;
    }

    setSubmitting(true);
    try {
      await placeBid({
        jobId: jobId as Id<"jobListings">,
        desiredSalary: num,
        message: message || undefined,
        yearsExp: yearsExp ? parseInt(yearsExp) : undefined,
        skills: skills
          ? skills.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      toast.success(`Your bid of $${num.toLocaleString()}/yr is live!`);
      setSalary("");
      setMessage("");
      setYearsExp("");
      setSkills("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place bid.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border/70 bg-card shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <h2 className="type-heading flex items-center gap-2">
                <Gavel className="size-5 text-primary" />
                Salary Bids
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {jobTitle} · {companyName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-6 py-5">
            {/* How it works */}
            <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="size-4" />
                How salary bidding works
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Coins className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>
                    <strong className="text-foreground">Lower salary = more attractive</strong>{" "}
                    to the employer
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Rocket className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>
                    <strong className="text-foreground">Pay to boost</strong> your bid above
                    others
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Trophy className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>
                    <strong className="text-foreground">Employers pick</strong> the best bidder
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <PenLine className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>Add a pitch and skills to stand out</span>
                </li>
              </ul>
            </div>

            {/* Place your bid */}
            <div className="mb-6 rounded-xl border border-border/70 bg-secondary/30 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="size-4 text-primary" />
                Place your salary bid
              </h3>

              <div className="mt-3 space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="Your desired annual salary"
                    className="pl-7 font-mono text-lg font-bold tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    /year
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(e.target.value)}
                    placeholder="Years of experience"
                    className="text-sm"
                  />
                  <Input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Skills (comma separated)"
                    className="text-sm"
                  />
                </div>

                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Short pitch to the employer (optional)"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border/70 bg-background px-9 py-2.5 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <Button
                  onClick={handleBid}
                  disabled={submitting || !salary}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Gavel className="size-4" />
                  {submitting ? "Placing bid…" : "Place Salary Bid"}
                </Button>
              </div>
            </div>

            {/* Existing bids */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Trophy className="size-4 text-primary" />
                Live bids ({bids?.length ?? 0})
              </h3>

              {!bids ? (
                <div className="mt-3 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : bids.length === 0 ? (
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  No bids yet. Be the first to bid!
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {bids.map((bid: JobBid, i: number) => (
                    <motion.div
                      key={bid._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3.5 transition",
                        i === 0
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/60 bg-card hover:border-border",
                      )}
                    >
                      {/* Rank badge */}
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : i === 1
                              ? "bg-amber-100 text-amber-700"
                              : i === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-sm font-semibold">
                            <User className="size-3" />
                            {bid.userName}
                          </span>
                          {bid.yearsExp && (
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {bid.yearsExp}yr exp
                            </span>
                          )}
                          {bid.isBoosted && (
                            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              <Rocket className="size-2.5" /> Boosted
                            </span>
                          )}
                        </div>
                        {bid.message && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            &ldquo;{bid.message}&rdquo;
                          </p>
                        )}
                        {bid.skills && bid.skills.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {bid.skills.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="rounded bg-secondary px-1.5 py-0.5 text-[10px]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Salary */}
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm font-bold tabular-nums text-primary">
                          ${bid.desiredSalary.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">/year</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
