// Zero-dependency canvas confetti in the Ocean & Land palette (teal, deep sea,
// moss, gold). Fires a short celebratory burst from the top of the viewport.
// No-ops when the user prefers reduced motion.

const ATLAS_COLORS = ["#1F6F5C", "#132A2E", "#A8C08A", "#C9A227"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
  shape: "rect" | "circle";
};

let activeCanvas: HTMLCanvasElement | null = null;

export function fireConfetti(opts?: { originX?: number; particleCount?: number }) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (activeCanvas) return; // one burst at a time

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);
  activeCanvas = canvas;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    activeCanvas = null;
    return;
  }
  const c = ctx;
  c.scale(dpr, dpr);

  const originX = (opts?.originX ?? 0.5) * w;
  const count = opts?.particleCount ?? 140;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    // Fan out from the origin, mostly upward.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.9);
    const speed = 6 + Math.random() * 9;
    particles.push({
      x: originX + (Math.random() - 0.5) * 60,
      y: h * 0.28,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 5,
      color: ATLAS_COLORS[Math.floor(Math.random() * ATLAS_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      shape: Math.random() < 0.7 ? "rect" : "circle",
    });
  }

  const gravity = 0.22;
  const drag = 0.985;
  const durationMs = 2600;
  const start = performance.now();

  function frame(now: number) {
    const elapsed = now - start;
    c.clearRect(0, 0, w, h);
    const fade = Math.max(0, 1 - elapsed / durationMs);

    for (const p of particles) {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;

      c.save();
      c.globalAlpha = fade;
      c.translate(p.x, p.y);
      c.rotate(p.rotation);
      c.fillStyle = p.color;
      if (p.shape === "rect") {
        c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        c.beginPath();
        c.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    if (elapsed < durationMs) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
      if (activeCanvas === canvas) activeCanvas = null;
    }
  }

  requestAnimationFrame(frame);
}
