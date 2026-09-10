import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

const RULES = [
  {
    title: "Rank is the bid — nothing else.",
    body: "Your position on any board is set by how much you've paid. Higher bid = higher rank. Ties favor the older entry.",
  },
  {
    title: "Listings are whole US dollars, $5 minimum.",
    body: "Submit a product URL or X/Twitter handle. A flat $5 gets you on the board. Maximum bid is $999,999.",
  },
  {
    title: "Boosts are $1 at a time.",
    body: "Once listed, you can boost your position by paying more. Each boost is a whole dollar. The more you pay, the higher you climb.",
  },
  {
    title: "Taking #1 costs $5 more than the current leader.",
    body: "If someone holds #1, you need to bid at least $5 above their total to take the top spot.",
  },
  {
    title: "Down-ranking costs double.",
    body: "Want to drag a rival down? Pay 2× their banked total. Every dollar you pay subtracts from their rank.",
  },
  {
    title: "5× Lock: defend #1 for 3 hours.",
    body: "If you drop 5× the runner-up's bank in a single boost while holding #1, your top spot locks for 3 hours. Money can't touch you during the lock.",
  },
  {
    title: "Retake pricing: reclaim #1 for the difference + $5.",
    body: "If you were knocked off #1, you can reclaim the lead by paying only the gap to the new leader plus a $5 premium.",
  },
  {
    title: "Free rank from stars and referrals.",
    body: "Stars add $0.10 of rank credit each. Referrals add $2 of credit. These can climb ranks but can't lock #1 or fund a retake.",
  },
  {
    title: "No ads. No API keys. No revenue share.",
    body: "The board is a public leaderboard. What you see is what you get — bid amounts, categories, and that's it.",
  },
  {
    title: "No expiration on bids.",
    body: "Once paid, your position holds until someone outbids you or down-ranks you. There's no decay, no time limit.",
  },
  {
    title: "Tracking params are stripped.",
    body: "Any UTM, ref, or tracking query parameters are removed from submitted URLs. The board stays clean and screenshot-friendly.",
  },
  {
    title: "Chat and invite links are blocked.",
    body: "Discord, WhatsApp, Telegram, and similar invite/chat links aren't allowed on the board. Product links and X profiles only.",
  },
];

export default function Rules() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:py-28">
        <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
          <motion.p
            variants={fadeUp}
            className="font-label flex items-center gap-2 text-xs font-medium text-primary"
          >
            <span className="inline-block size-2 rounded-full bg-primary" />
            Atlas AI — Rules
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="type-display mt-4"
          >
            The rules.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-muted-foreground"
          >
            Simple, public, and short. Every mechanic is visible on the board —
            no hidden mechanics, no fine print.
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="mt-3 text-xs text-muted-foreground/70"
          >
            These rules are owned and maintained by Atlas AI in accordance with
            our privacy policy. By using the platform you agree to these terms.
          </motion.p>
        </motion.div>

        <motion.ol
          variants={stagger(0.04)}
          initial="hidden"
          animate="show"
          className="mt-12 space-y-1"
        >
          {RULES.map((r, i) => (
            <motion.li
              key={i}
              variants={fadeUp}
              className="rounded-xl border border-border/70 bg-card p-5 sm:p-6"
            >
              <div className="flex gap-4">
                <span className="font-display shrink-0 text-lg font-black text-primary/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{r.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {r.body}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ol>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="font-label text-[11px] text-muted-foreground">
            These rules are owned by Atlas AI as per our privacy policy.
            Sabotage, free stars, referrals, and paid listings are
            Atlas AI enhancements on top of core leaderboard mechanics.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/board">
                See the boards
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
