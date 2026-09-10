import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.svg";
import { CompassRose } from "@/components/compass-rose";
import {
  ArrowRight,
  Gavel,
  Loader2,
  Mail,
  Star,
  Trophy,
  UserX,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="bg-ink grain relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <CompassRose className="pointer-events-none absolute -right-24 -top-24 size-[28rem] text-background opacity-[0.04]" />
        <Link to="/" className="relative z-10 flex items-center gap-3">
          <img src={logo} alt="Atlas" className="size-10 rounded-xl" />
          <span className="font-display text-2xl font-bold tracking-tight text-background">
            Atlas<span className="text-primary">.</span>
          </span>
        </Link>
        <div className="relative z-10 max-w-lg">
          <p className="font-label mb-5 flex items-center gap-2 text-xs font-medium text-primary/80">
            <span className="live-dot" />
            The board is live
          </p>
          <h1 className="type-display-lg text-background leading-[0.95]">
            Claim your{" "}
            <span className="text-accent-orange italic">spot.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-background/50">
            Rank products, profiles, and projects with real money at stake.
            Stars are free — boosts and sabotage are forever.
          </p>
          <ul className="mt-10 space-y-5">
            {[
              {
                icon: <Trophy className="size-4" />,
                title: "Earn rank with receipts",
                body: "Every position is backed by real dollars — no vanity metrics.",
              },
              {
                icon: <Star className="size-4" />,
                title: "Star favorites for free",
                body: "The crowd's signal, counted in money terms. $0.10 credit each.",
              },
              {
                icon: <Gavel className="size-4" />,
                title: "Outbid rivals live",
                body: "Boosts climb, sabotage drags down. Ranks move in real time.",
              },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-background/10 bg-background/5 text-primary/80">
                  {f.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-background/90">
                    {f.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-background/40">
                    {f.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 font-label text-[10px] uppercase tracking-wide text-background/25">
          Passwordless · one-time email code
        </p>
      </aside>

      {/* Auth panel */}
      <main className="bg-mesh-gradient flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-10 flex items-center justify-center gap-3 lg:hidden"
          >
            <img src={logo} alt="Atlas" className="size-10 rounded-xl" />
            <span className="font-display text-2xl font-bold tracking-tight">
              Atlas<span className="text-primary">.</span>
            </span>
          </Link>

          <Card className="hairline rounded-3xl shadow-elevated">
            {step === "signIn" ? (
              <>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-display text-2xl">
                    Get started
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/60">
                    One code, no password — log in or sign up with your email.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleEmailSubmit}>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                      <Input
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        className="h-12 rounded-xl pl-10"
                        autoComplete="email"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="sheen-on-hover h-12 w-full rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Sending code…
                        </>
                      ) : (
                        <>
                          Continue with email
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                    {error && (
                      <p className="text-sm text-red-500">{error}</p>
                    )}

                    <div className="relative pt-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/30" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="font-label bg-background px-3 text-[10px] text-muted-foreground/70">
                          or
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-full rounded-xl"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                    >
                      <UserX className="size-4" />
                      Continue as guest
                    </Button>
                    <p className="text-center text-xs text-muted-foreground/70">
                      Look around first — you can list once you sign in.
                    </p>
                  </CardContent>
                </form>
              </>
            ) : (
              <>
                <CardHeader className="mt-6 text-center pb-2">
                  <CardTitle className="font-display text-2xl">
                    Check your inbox
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/60">
                    We sent a 6-digit code to{" "}
                    <span className="font-mono text-foreground/80">{step.email}</span>
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleOtpSubmit}>
                  <CardContent className="pb-4">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />

                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                            const form = (e.target as HTMLElement).closest("form");
                            if (form) {
                              form.requestSubmit();
                            }
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && (
                      <p className="mt-3 text-sm text-red-500 text-center">
                        {error}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground/75 text-center mt-5">
                      Didn't receive a code?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setStep("signIn")}
                      >
                        Try again
                      </Button>
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-3">
                    <Button
                      type="submit"
                      className="h-12 w-full rounded-xl"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify code
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep("signIn")}
                      disabled={isLoading}
                      className="w-full rounded-xl"
                    >
                      Use different email
                    </Button>
                  </CardFooter>
                </form>
              </>
            )}

            <div className="rounded-b-2xl border-t border-border/20 bg-muted/30 px-6 py-4 text-center text-xs text-muted-foreground/70">
              Passwordless & private — we email a one-time code, never share your address.
            </div>
          </Card>

          <p className="font-label mt-8 text-center text-[10px] uppercase tracking-wide text-muted-foreground/30">
            <Link to="/" className="transition-colors hover:text-foreground">
              ← Back to the front page
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
