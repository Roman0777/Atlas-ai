import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { AnimatedCents } from "@/components/animated-number";
import { Button } from "@/components/ui/button";
import { Crown, Lock, Star, Shield, Swords } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { RankBadge } from "@/components/rank-badge";
import { EASE } from "@/lib/motion";
import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

const R = 1; // globe radius (scene units)

// ---------------------------------------------------------------------------
// Geo data — stylized continent outlines (lon, lat) for the dot-matrix land.
// ---------------------------------------------------------------------------
const LAND_POLYGONS: [number, number][][] = [
  // North America
  [[-168, 66], [-140, 70], [-125, 71], [-110, 69], [-95, 71], [-80, 73], [-68, 64], [-56, 52], [-66, 45], [-75, 40], [-81, 31], [-82, 25], [-90, 20], [-97, 18], [-105, 22], [-115, 30], [-125, 40], [-130, 55], [-150, 60], [-165, 60]],
  // Central America
  [[-95, 18], [-88, 21], [-83, 15], [-78, 8], [-82, 8], [-90, 14]],
  // South America
  [[-80, 10], [-70, 12], [-60, 10], [-50, 0], [-35, -8], [-40, -22], [-55, -35], [-65, -42], [-72, -52], [-75, -45], [-70, -30], [-78, -10], [-80, 0]],
  // Greenland
  [[-45, 60], [-30, 68], [-25, 75], [-40, 80], [-60, 78], [-55, 68]],
  // Europe
  [[-10, 42], [-8, 48], [0, 50], [5, 54], [10, 58], [20, 60], [30, 60], [40, 55], [40, 48], [28, 42], [20, 38], [10, 38], [0, 38]],
  // UK / Ireland
  [[-6, 50], [-2, 53], [-4, 58], [-8, 57], [-10, 53]],
  // Africa
  [[-17, 15], [-10, 25], [0, 32], [10, 33], [20, 32], [32, 31], [35, 25], [40, 15], [45, 10], [42, 0], [40, -10], [35, -20], [30, -30], [20, -35], [15, -28], [12, -15], [8, 0], [9, 5], [-5, 5], [-12, 8]],
  // Madagascar
  [[44, -12], [50, -16], [47, -25], [44, -22], [43, -16]],
  // Siberia / North Asia
  [[40, 50], [60, 52], [90, 52], [120, 52], [150, 52], [170, 52], [178, 66], [160, 70], [120, 74], [90, 75], [70, 72], [50, 66], [42, 58]],
  // Central + South Asia
  [[42, 50], [60, 48], [75, 50], [90, 48], [100, 45], [120, 50], [130, 48], [122, 40], [120, 32], [110, 25], [105, 20], [100, 14], [97, 18], [90, 22], [85, 20], [80, 12], [76, 8], [70, 22], [62, 25], [55, 28], [48, 38], [44, 44]],
  // Middle East
  [[25, 40], [35, 38], [45, 38], [55, 26], [60, 25], [58, 22], [50, 15], [45, 13], [40, 18], [35, 28], [28, 34]],
  // Southeast Asia
  [[95, 20], [105, 22], [110, 20], [108, 12], [105, 5], [102, 2], [100, 6], [98, 12], [97, 16]],
  // Indonesia
  [[95, 5], [105, 0], [115, -3], [125, -5], [135, -4], [140, -8], [130, -8], [120, -9], [110, -8], [100, -2], [95, 2]],
  // Japan
  [[130, 32], [136, 35], [141, 40], [143, 44], [140, 42], [136, 37], [131, 33]],
  // Australia
  [[114, -22], [122, -14], [130, -12], [137, -12], [142, -11], [147, -19], [153, -26], [150, -34], [144, -38], [138, -36], [130, -32], [120, -34], [115, -30]],
  // New Zealand
  [[172, -35], [175, -38], [178, -39], [174, -42], [170, -44], [167, -46], [170, -42]],
];

function pointInPoly(lon: number, lat: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function isLand(lat: number, lon: number): boolean {
  return LAND_POLYGONS.some((p) => pointInPoly(lon, lat, p));
}

/** lat/lon (degrees) → position on a sphere of radius r. */
function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

// ---------------------------------------------------------------------------
// Globe palettes — nature "world atlas" color sets.
// ---------------------------------------------------------------------------
export type PaletteKey = "ocean" | "forest" | "oceanReward";

export interface GlobePalette {
  landA: string;
  landB: string;
  spark: string;
  ocean: string;
  oceanEmissive: string;
  atmosphere: string;
  graticule: string;
  arc: string;
  pulse: string;
  hub: string;
  ring: string;
}

export const GLOBE_PALETTES: Record<PaletteKey, GlobePalette> = {
  // Ocean & Land — teal sea, moss-green land, ochre gold highlights
  ocean: {
    landA: "#7FA65A",
    landB: "#93B56B",
    spark: "#CBD9A8",
    ocean: "#175650",
    oceanEmissive: "#0A2E2A",
    atmosphere: "#2AAE8C",
    graticule: "#9DB8A0",
    arc: "#2FAE8F",
    pulse: "#C9A227",
    hub: "#C9A227",
    ring: "#2FAE8F",
  },
  // Deep Forest — emerald land on a dark forest sea, sand highlights
  forest: {
    landA: "#5E9C6E",
    landB: "#74AE84",
    spark: "#B9D9B6",
    ocean: "#1E4530",
    oceanEmissive: "#0B1F14",
    atmosphere: "#4E9A6A",
    graticule: "#9BB89F",
    arc: "#4E9A6A",
    pulse: "#D9B36A",
    hub: "#D9B36A",
    ring: "#4E9A6A",
  },
  // Ocean & Land, with warm orange reserved for rewards/streaks arcs
  oceanReward: {
    landA: "#7FA65A",
    landB: "#93B56B",
    spark: "#CBD9A8",
    ocean: "#175650",
    oceanEmissive: "#0A2E2A",
    atmosphere: "#2AAE8C",
    graticule: "#9DB8A0",
    arc: "#E8724A",
    pulse: "#E8724A",
    hub: "#E8724A",
    ring: "#E8724A",
  },
};

// ---------------------------------------------------------------------------
// Land dot-matrix — one Points geometry, dots colored in Atlas palette.
// ---------------------------------------------------------------------------
function LandDots({ palette }: { palette: GlobePalette }) {
  const { positions, colors } = useMemo(() => {
    const N = 26000;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pos: number[] = [];
    const col: number[] = [];
    const cA = new THREE.Color(palette.landA);
    const cB = new THREE.Color(palette.landB);
    const spark = new THREE.Color(palette.spark);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const x = Math.cos(theta) * rad;
      const z = Math.sin(theta) * rad;
      const lat = (Math.asin(y) * 180) / Math.PI;
      const lon = (Math.atan2(z, x) * 180) / Math.PI;
      if (!isLand(lat, lon)) continue;
      const v = latLonToVec3(lat, lon, R * 1.002);
      pos.push(v.x, v.y, v.z);
      // Vibrant mix — primary land color, banded variation, rare sparks.
      const band = 0.5 + 0.5 * Math.sin(lat * 0.11);
      c.copy(cA).lerp(cB, band * 0.55);
      if ((i * 2654435761) % 97 < 6) c.lerp(spark, 0.7);
      // Baked lighting — brighter on the "sun" side for depth as it rotates.
      const light = 0.55 + 0.45 * Math.max(0, v.x * 0.6 + v.z * 0.8);
      col.push(c.r * light, c.g * light, c.b * light);
    }
    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col),
    };
  }, [palette.landA, palette.landB, palette.spark]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.016} sizeAttenuation vertexColors transparent opacity={0.95} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Subtle graticule — keeps the "atlas" identity of the old wireframe.
// ---------------------------------------------------------------------------
function Graticule({ color }: { color: string }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const push = (a: THREE.Vector3, b: THREE.Vector3) => {
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    };
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = 0; lon < 360; lon += 4) {
        push(latLonToVec3(lat, lon - 180, R * 1.001), latLonToVec3(lat, lon - 176, R * 1.001));
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -88; lat < 88; lat += 4) {
        push(latLonToVec3(lat, lon, R * 1.001), latLonToVec3(lat + 4, lon, R * 1.001));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.07} />
    </lineSegments>
  );
}

// ---------------------------------------------------------------------------
// Ocean sphere + fresnel atmosphere glow.
// ---------------------------------------------------------------------------
function Ocean({
  sphereRef,
  palette,
}: {
  sphereRef?: React.RefObject<THREE.Mesh | null>;
  palette: GlobePalette;
}) {
  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[R * 0.99, 48, 48]} />
      <meshStandardMaterial
        color={palette.ocean}
        roughness={0.55}
        metalness={0.25}
        emissive={palette.oceanEmissive}
        emissiveIntensity={0.6}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Hub cities + animated trade arcs (the "deal-flow network" look).
// ---------------------------------------------------------------------------
const HUBS: Record<string, [number, number]> = {
  sf: [37, -122],
  nyc: [40, -74],
  london: [51, -1],
  berlin: [52, 13],
  dubai: [25, 55],
  singapore: [1, 103],
  tokyo: [35, 139],
  sydney: [-33, 151],
  saopaulo: [-23, -46],
  lagos: [6, 3],
  capetown: [-33, 18],
  bangalore: [12, 77],
};

const ARC_PAIRS: [keyof typeof HUBS, keyof typeof HUBS][] = [
  ["sf", "nyc"],
  ["nyc", "london"],
  ["london", "berlin"],
  ["berlin", "dubai"],
  ["dubai", "singapore"],
  ["singapore", "sydney"],
  ["saopaulo", "lagos"],
  ["lagos", "capetown"],
  ["tokyo", "sf"],
  ["bangalore", "singapore"],
  ["london", "saopaulo"],
  ["dubai", "bangalore"],
];

function arcPoints(a: THREE.Vector3, b: THREE.Vector3): [number, number, number][] {
  const dist01 = a.distanceTo(b) / 2;
  const mid = a
    .clone()
    .add(b)
    .normalize()
    .multiplyScalar(R * (1.12 + dist01 * 0.45));
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  return curve.getPoints(60).map((p) => p.toArray() as [number, number, number]);
}

function Arcs({ animate, palette }: { animate: boolean; palette: GlobePalette }) {
  const items = useMemo(
    () =>
      ARC_PAIRS.map(([a, b], i) => ({
        points: arcPoints(
          latLonToVec3(HUBS[a][0], HUBS[a][1], R * 1.005),
          latLonToVec3(HUBS[b][0], HUBS[b][1], R * 1.005),
        ),
        phase: (i / ARC_PAIRS.length) * Math.PI * 2,
      })),
    [],
  );

  const lineRefs = useRef<(THREE.Mesh | null)[]>([]);
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    items.forEach((item, i) => {
      const w = animate ? 0.5 + 0.5 * Math.sin(t * 1.6 + item.phase) : 0.5;
      const lineMat = lineRefs.current[i]?.material as THREE.Material | undefined;
      if (lineMat) lineMat.opacity = 0.08 + w * 0.3;
      const pulse = pulseRefs.current[i];
      if (pulse) {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(...item.points[0]),
          new THREE.Vector3(...item.points[30]),
          new THREE.Vector3(...item.points[59]),
        );
        const p = curve.getPoint(animate ? (t * 0.12 + item.phase) % 1 : 0.5);
        pulse.position.copy(p);
        const mat = pulse.material as THREE.Material;
        mat.opacity = 0.25 + w * 0.75;
      }
    });
  });

  return (
    <group>
      {items.map((item, i) => (
        <group key={i}>
          <Line
            ref={(m) => {
              lineRefs.current[i] = m;
            }}
            points={item.points}
            color={palette.arc}
            lineWidth={1}
            transparent
            opacity={0.25}
          />
          <mesh
            ref={(m) => {
              pulseRefs.current[i] = m;
            }}
          >
            <sphereGeometry args={[0.011, 8, 8]} />
            <meshBasicMaterial color={palette.pulse} transparent opacity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Surface markers — pulsing rings (used for hubs & pinned listings).
// ---------------------------------------------------------------------------
function useSurfaceQuat(lat: number, lon: number) {
  return useMemo(() => {
    const normal = latLonToVec3(lat, lon, 1).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  }, [lat, lon]);
}

function PulseRing({
  lat,
  lon,
  phase,
  animate,
  color = "#2FAE8F",
}: {
  lat: number;
  lon: number;
  phase: number;
  animate: boolean;
  color?: string;
}) {
  const quat = useSurfaceQuat(lat, lon);
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ringRef.current;
    if (!m) return;
    const t = animate ? (clock.elapsedTime * 0.5 + phase) % 1 : 0.4;
    const s = 1 + t * 2.2;
    m.scale.setScalar(s);
    (m.material as THREE.Material).opacity = (1 - t) * 0.5;
  });
  return (
    <group position={latLonToVec3(lat, lon, R * 1.004).toArray()} quaternion={quat}>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.02, 0.026, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function HubDots({ color }: { color: string }) {
  const dots = useMemo(
    () => Object.values(HUBS).map(([lat, lon]) => latLonToVec3(lat, lon, R * 1.003).toArray()),
    [],
  );
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(dots.flat()), 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.028} sizeAttenuation color={color} transparent opacity={0.9} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Globe assembly + shared canvas.
// ---------------------------------------------------------------------------
function GlobeCore({
  oceanRef,
  animate,
  palette,
}: {
  oceanRef: React.RefObject<THREE.Mesh | null>;
  animate: boolean;
  palette: GlobePalette;
}) {
  return (
    <group rotation={[0.12, 0, -0.16]}>
      <Ocean sphereRef={oceanRef} palette={palette} />
      <LandDots palette={palette} />
      <Graticule color={palette.graticule} />
      <Arcs animate={animate} palette={palette} />
      <HubDots color={palette.hub} />
      {Object.entries(HUBS).map(([key, [lat, lon]], i) => (
        <PulseRing
          key={key}
          lat={lat}
          lon={lon}
          phase={(i * 0.37) % 1}
          animate={animate}
          color={palette.ring}
        />
      ))}
    </group>
  );
}

function usePageVisible() {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return visible;
}

function useReducedMotion() {
  return useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
}

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA = { position: [0, 0.55, 2.75] as [number, number, number], fov: 42 };

function GlobeCanvas({ children }: { children: React.ReactNode }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={CANVAS_GL}
      camera={CAMERA}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 2, 2]} intensity={1.2} color="#ffe6c4" />
      {children}
    </Canvas>
  );
}

function GlobeControls({ animate }: { animate: boolean }) {
  return (
    <OrbitControls
      enableZoom={false}
      enablePan={false}
      autoRotate={animate}
      autoRotateSpeed={0.7}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      minPolarAngle={Math.PI * 0.22}
      maxPolarAngle={Math.PI * 0.78}
    />
  );
}

/**
 * AtlasGlobeHero — the Landing hero globe. Fully interactive (drag to spin),
 * auto-rotates when idle. Replaces the old wireframe canvas.
 */
export function AtlasGlobeHero({
  className,
  palette: paletteKey = "ocean",
  size,
}: {
  className?: string;
  palette?: PaletteKey;
  size?: number;
}) {
  const oceanRef = useRef<THREE.Mesh>(null);
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const animate = !reduced;
  const palette = GLOBE_PALETTES[paletteKey];

  return (
    <div className={cn("pointer-events-auto absolute touch-none", className)} aria-hidden>
      <div style={size ? { width: size, height: size } : undefined} className={size ? "" : "size-[440px] lg:size-[560px]"}>
        {visible ? (
          <GlobeCanvas>
            <GlobeCore oceanRef={oceanRef} animate={animate} palette={palette} />
            <GlobeControls animate={animate} />
          </GlobeCanvas>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Showcase — "The Atlas." board section with pinned top-3 listing cards.
// ---------------------------------------------------------------------------
interface Listing {
  _id: string;
  ownerId: string;
  title: string;
  url: string;
  tagline?: string;
  category: string;
  totalPaid: number;
  starCount: number;
  isLocked: boolean;
  rank: number;
  ownerName?: string;
}

const PIN_ANGLES: [number, number][] = [
  [20, -30],
  [-15, 100],
  [48, 15],
];

function faviconUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return null;
  }
}

export function AtlasGlobeShowcase({
  listings,
  myIds,
  onPay,
  onDetail,
  palette: paletteKey = "ocean",
}: {
  listings: Listing[];
  myIds: Set<string>;
  onPay: (l: Listing, kind: "boost" | "dislike") => void;
  onDetail: (id: string) => void;
  palette?: PaletteKey;
}) {
  const oceanRef = useRef<THREE.Mesh>(null);
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const animate = !reduced;
  const palette = GLOBE_PALETTES[paletteKey];

  const top3 = listings.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mb-6 text-center"
      >
        <p className="font-label flex items-center justify-center gap-2 text-xs font-medium text-primary">
          <Crown className="size-3.5" />
          TOP THREE
        </p>
        <h2 className="type-display mt-2">The Atlas.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The top three spots — pinned to the world stage. Drag to spin the globe.
        </p>
      </motion.div>

      <div className="relative mx-auto" style={{ maxWidth: 680, height: 540 }}>
        <div className="absolute inset-0">
          {visible ? (
            <GlobeCanvas>
              <GlobeCore oceanRef={oceanRef} animate={animate} palette={palette} />
              <GlobeControls animate={animate} />
              {top3.map((listing, i) => {
                const [lat, lon] = PIN_ANGLES[i];
                const pos = latLonToVec3(lat, lon, R * 1.06);
                return <PinnedCard key={listing._id} listing={listing} index={i} pos={pos} oceanRef={oceanRef} myIds={myIds} onPay={onPay} onDetail={onDetail} />;
              })}
            </GlobeCanvas>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PinnedCard({
  listing,
  index,
  pos,
  oceanRef,
  myIds,
  onPay,
  onDetail,
}: {
  listing: Listing;
  index: number;
  pos: THREE.Vector3;
  oceanRef: React.RefObject<THREE.Mesh | null>;
  myIds: Set<string>;
  onPay: (l: Listing, kind: "boost" | "dislike") => void;
  onDetail: (id: string) => void;
}) {
  const fav = faviconUrl(listing.url);
  const isMine = myIds.has(listing._id);
  const isTop = index === 0;

  return (
    <Html
      position={pos.toArray()}
      center
      zIndexRange={[30, 0]}
      occlude={[oceanRef as unknown as React.RefObject<THREE.Object3D>]}
      style={{ pointerEvents: "auto" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 + index * 0.15, ease: EASE }}
        className={cn(
          "group relative w-[208px] cursor-grab rounded-2xl border bg-card/95 p-3.5 pt-4 shadow-xl backdrop-blur-md",
          "transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-2xl",
          "active:cursor-grabbing",
          isTop
            ? "border-primary/45 shadow-primary/15"
            : "border-border/60 hover:border-primary/25",
        )}
      >
        {/* Rendered medal — replaces the platform-dependent emoji */}
        <div className="absolute -left-2 -top-2.5 drop-shadow-sm">
          <RankBadge rank={index + 1} size="md" />
        </div>

        {/* Header: category glyph + locked state */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary/90">
            <CategoryIcon category={listing.category} className="size-3" />
            <span className="max-w-[104px] truncate">
              {getCategory(listing.category)?.label ?? "Other"}
            </span>
          </span>
          {listing.isLocked && <Lock className="size-3 shrink-0 text-muted-foreground" />}
        </div>

        {/* Title — two lines instead of a single truncated line */}
        <div className="mt-2 flex items-start gap-1.5">
          {fav && (
            <img
              src={fav}
              alt=""
              className="mt-0.5 size-4 shrink-0 rounded"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <button
            type="button"
            onClick={() => onDetail(listing._id)}
            className="line-clamp-2 text-left text-[13px] font-semibold leading-snug tracking-tight hover:text-primary"
          >
            {listing.title}
          </button>
        </div>

        {/* Metric row */}
        <div className="mt-2.5 flex items-baseline justify-between border-t border-border/50 pt-2">
          <AnimatedCents
            value={listing.totalPaid}
            className={cn("type-data text-base font-semibold", isTop ? "text-primary" : "text-foreground")}
          />
          <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
            <Star className="size-2.5 fill-[#D9B36A] text-[#B08D1E]" />
            {listing.starCount}
          </span>
        </div>

        {/* Action — single calm primary for defense, quiet outline for offence */}
        <div className="mt-2.5">
          {isMine ? (
            <Button size="sm" className="h-7 w-full gap-1 text-[10px]" onClick={() => onPay(listing, "boost")}>
              <Shield className="size-2.5" /> Defend
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full gap-1 text-[10px] hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onPay(listing, "dislike")}
            >
              <Swords className="size-2.5" /> Knock down
            </Button>
          )}
        </div>
      </motion.div>
    </Html>
  );
}
