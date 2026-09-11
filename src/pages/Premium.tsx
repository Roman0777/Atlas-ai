import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAction } from "convex/react";
import {
  ArrowRight,
  Check,
  Crown,
  Gem,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For casual founders exploring the board.",
    features: [
      "Star listings for free",
      "Submit 1 listing",
      "Basic board access",
      "Daily renewal credits",
    ],
    cta: "Current Plan",
    icon: Star,
    highlight: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$9",
    period: "/month",
    description: "For serious founders who want to lead.",
    features: [
      "Unlimited listings",
      "Priority board placement",
      "Advanced analytics",
      "Priority support",
      "Early access to features",
    ],
    cta: "Upgrade Now",
    icon: Crown,
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For teams and power users.",
    features: [
      "Everything in Premium",
      "Team collaboration",
      "API access",
      "Custom branding",
      "Dedicated account manager",
    ],
    cta: "Go Pro",
    icon: Gem,
    highlight: false,
  },
] as const;

export default function Premium() {
  const { isAuthenticated, isPremium } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const createCheckout = useAction(api.payments.createCheckout);

  if (!isAuthenticated) {
    return <Navigate to="/auth?returnTo=/premium" replace />;
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader active="premium" />
        <main className="mx-auto w-full max-w-3xl px-5 py-20 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex size-20 items-center justify-center rounded-full bg-accent/10">
              <Crown className="size-10 text-accent" />
            </div>
            <h1 className="type-display">You're a Premium member</h1>
            <p className="max-w-md text-muted-foreground">
              You have full access to all premium features. Thank you for
              supporting Atlas.
            </p>
            <Button size="lg" onClick={() => window.history.back()}>
              Back to Dashboard
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  async function handleUpgrade(planId: string) {
    const dodoPlan = planId === "premium" || planId === "pro" ? planId : null;
    if (!dodoPlan) return;
    setSelectedPlan(dodoPlan);
    try {
      const amountCents = dodoPlan === "premium" ? 900 : 2900;
      const url = await createCheckout({
        amountCents,
        kind: "subscription",
        origin: window.location.origin,
        plan: dodoPlan,
      });
      if (url) {
        window.location.assign(url);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
      setSelectedPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="premium" />
      <main className="mx-auto w-full max-w-5xl px-5 py-16">
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-16 text-center"
        >
          <p className="eyebrow mb-4">Premium</p>
          <h1 className="type-display mb-4">Level up your board presence</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Unlock unlimited listings, priority placement, and powerful tools to
            dominate the leaderboard.
          </p>
        </motion.header>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={cn(
                  "relative flex h-full flex-col transition-all",
                  plan.highlight && "border-accent shadow-lg shadow-accent/10",
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    Most Popular
                  </div>
                )}
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="mb-6">
                    <plan.icon className="mb-3 size-8 text-accent" />
                    <h2 className="font-display text-xl font-bold">
                      {plan.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="font-display text-3xl font-black">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>

                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlight ? "default" : "outline"}
                    className="w-full"
                    disabled={plan.id === "free" || selectedPlan === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {selectedPlan === plan.id ? (
                      "Redirecting..."
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
