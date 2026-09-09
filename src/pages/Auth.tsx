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
      {/* Brand panel — editorial showcase (desktop) */}
      <aside className="bg-ink grain relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <CompassRose className="pointer-events-none absolute -right-20 -top-20 size-96 text-background opacity-[0.06]" />
        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <img src={logo} alt="Atlas" className="size-9 rounded-lg" />
          <span className="font-display text-2xl font-bold tracking-tight text-background">
            Atlas<span className="text-primary">.</span>
          </span>
        </Link>
        <div className="relative z-10 max-w-lg">
          <p className="font-label mb-4 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="live-dot" />
            The board is live
          </p>
          <h1 className="type-display-lg text-background">
            Claim your{" "}
            <span className="text-accent-orange italic">spot.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-background/70 sm:text-base">
            Rank products, profiles, and projects with real money at stake.
            Stars are free — boosts and sabotage are forever.
          </p>
          <ul className="mt-9 space-y-4">
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
              <li key={f.title} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-background/15 bg-background/5 text-primary">
                  {f.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-background">
                    {f.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-background/60">
                    {f.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 font-label text-[10px] uppercase tracking-wide text-background/40">
          Passwordless · one-time email code
        </p>
      </aside>

      {/* Auth panel */}
      <main className="bg-mesh-gradient flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <Link
            to="/"
            className="mb-8 flex items-center justify-center gap-2.5 lg:hidden"
          >
            <img src={logo} alt="Atlas" className="size-9 rounded-lg" />
            <span className="font-display text-2xl font-bold tracking-tight">
              Atlas<span className="text-primary">.</span>
            </span>
          </Link>
          <Card className="hairline min-w-[350px] rounded-xl pb-0 shadow-elevated">
          {step === "signIn" ? (
            <>
              <CardHeader className="text-center">
                <CardTitle className="font-display text-2xl">
                  Get started
                </CardTitle>
                <CardDescription>
                  One code, no password — log in or sign up with your email.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      className="pl-9"
                      autoComplete="email"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="sheen-on-hover mt-3 w-full"
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
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="font-label bg-background px-2 text-[10px] text-muted-foreground">
                          or
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="metal"
                      className="mt-4 w-full"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                    >
                      <UserX className="size-4" />
                      Continue as guest
                    </Button>
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Look around first — you can list once you sign in.
                    </p>
                  </div>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="mt-4 text-center">
                <CardTitle className="font-display text-2xl">
                  Check your inbox
                </CardTitle>
                <CardDescription>
                  We sent a 6-digit code to{" "}
                  <span className="font-mono text-foreground">{step.email}</span>
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
                          // Find the closest form and submit it
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
                    <p className="mt-2 text-sm text-red-500 text-center">
                      {error}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground text-center mt-4">
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
                <CardFooter className="flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
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
                    className="w-full"
                  >
                    Use different email
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          <div className="rounded-b-lg border-t bg-muted/60 px-6 py-3.5 text-center text-xs text-muted-foreground">
            Passwordless & private — we email a one-time code, never share your
            address.
          </div>
        </Card>
          <p className="font-label mt-6 text-center text-[10px] uppercase tracking-wide text-muted-foreground/60">
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
