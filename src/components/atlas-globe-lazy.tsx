import { lazy, Suspense } from "react";

/**
 * Lazy wrappers around the Three.js Atlas globe (atlas-globe-3d.tsx).
 * Keeps the large three.js vendor chunk out of page bundles until a
 * globe is actually rendered.
 */
const AtlasGlobeShowcase = lazy(() =>
  import("@/components/atlas-globe-3d").then((m) => ({
    default: m.AtlasGlobeShowcase,
  })),
);

const AtlasGlobeHero = lazy(() =>
  import("@/components/atlas-globe-3d").then((m) => ({
    default: m.AtlasGlobeHero,
  })),
);

/** Pulsing ring fallback while the three.js chunk loads. */
function GlobeFallback() {
  return (
    <div className="flex items-center justify-center py-16" aria-hidden>
      <div className="size-72 animate-pulse rounded-full border border-primary/20 bg-primary/[0.03]" />
    </div>
  );
}

/** Board usage — full "The Atlas." section with pinned top-3 listing cards. */
export function AtlasGlobeShowcaseLazy(
  props: React.ComponentProps<typeof AtlasGlobeShowcase>,
) {
  return (
    <Suspense fallback={<GlobeFallback />}>
      <AtlasGlobeShowcase {...props} />
    </Suspense>
  );
}

/** Landing hero usage — decorative interactive 3D globe. */
export function AtlasGlobeHeroLazy(props: React.ComponentProps<typeof AtlasGlobeHero>) {
  return (
    <Suspense fallback={null}>
      <AtlasGlobeHero {...props} />
    </Suspense>
  );
}

