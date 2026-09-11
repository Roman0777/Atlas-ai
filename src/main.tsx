import '@vly-ai/integrations';
import { DevBackendBanner } from "@/components/dev-backend-banner";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { MotionConfig, AnimatePresence, motion } from "framer-motion";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { EASE } from "@/lib/motion";
import { ScrollProgress } from "@/components/scroll-progress";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Board = lazy(() => import("./pages/Board.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Rules = lazy(() => import("./pages/Rules.tsx"));
const Jobs = lazy(() => import("./pages/Jobs.tsx"));
const News = lazy(() => import("./pages/News.tsx"));
const Credits = lazy(() => import("./pages/Credits.tsx"));
const Network = lazy(() => import("./pages/Network.tsx"));
const NetworkProfile = lazy(() => import("./pages/NetworkProfile.tsx"));
const Premium = lazy(() => import("./pages/Premium.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

/** Cross-fade page transitions on every route change. */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: EASE }}
      >
        <Suspense fallback={<RouteLoading />}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route
              path="/auth"
              element={<AuthPage redirectAfterAuth="/dashboard" />}
            />
            <Route path="/board" element={<Board />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/news" element={<News />} />
            <Route
              path="/credits"
              element={
                <RequireAuth>
                  <Credits />
                </RequireAuth>
              }
            />
            <Route
              path="/network"
              element={
                <RequireAuth>
                  <Network />
                </RequireAuth>
              }
            />
            <Route
              path="/network/startup/:id"
              element={
                <RequireAuth>
                  <NetworkProfile kind="startup" />
                </RequireAuth>
              }
            />
            <Route
              path="/network/investor/:id"
              element={
                <RequireAuth>
                  <NetworkProfile kind="investor" />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route path="/premium" element={<Premium />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

/** Scrolls to the element matching the URL hash (e.g. /news#newsletter).
 *  SPA navigation doesn't auto-scroll to hashes, so we do it manually —
 *  retrying briefly to wait for the lazy route chunk + enter animation. */
function HashScroller() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    let timer: number | undefined;
    let cancelled = false;
    const tryScroll = (attempt: number) => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempt < 20) {
        timer = window.setTimeout(() => tryScroll(attempt + 1), 100);
      }
    };
    // Give the lazy route + framer-motion enter transition a beat to settle.
    timer = window.setTimeout(() => tryScroll(0), 350);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [location.pathname, location.hash]);
  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <ScrollProgress />
            <RouteSyncer />
            <HashScroller />
            <AnimatedRoutes />
          </BrowserRouter>
        </MotionConfig>
        <Toaster />
        <DevBackendBanner />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
