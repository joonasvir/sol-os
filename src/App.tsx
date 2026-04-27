import { useMemo, useState } from "react";
import { computeEnvironment, PRESETS, type Inputs } from "./environment";
import { DEFAULT_STYLE, type Style } from "./style";
import { Phone } from "./Phone";
import { Controls } from "./Controls";
import { About } from "./About";

const DEFAULT: Inputs = {
  hour: 8.5,
  clouds: 18,
  tiltX: 0,
  tiltY: 0,
  sunGaze: 60,
  sunGazeEnabled: false,
  sunGazeMode: "sun",
  sunGazePosition: 30,
  depth: 45,
  depthOffset: 0,
  shadowIntensity: 110,
  shadowLength: 130,
  shadowSoftness: 100,
  shadowSpread: 0,
  shadowTintShift: 0,
  shadowContact: 100,
  shadowReach: 100,
  shadowAngleOffset: 0,
  shadowDistance: 0,
};

function hexToTriplet(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export default function App() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT);
  const [style, setStyle] = useState<Style>(DEFAULT_STYLE);
  const [aboutOpen, setAboutOpen] = useState(false);
  const env = useMemo(() => computeEnvironment(inputs), [inputs]);

  const styleVars: React.CSSProperties = {
    // Shadow vector
    ["--shadow-x" as any]: `${env.shadowX.toFixed(2)}px`,
    ["--shadow-y" as any]: `${env.shadowY.toFixed(2)}px`,
    ["--shadow-blur" as any]: `${env.shadowBlur.toFixed(2)}px`,
    ["--shadow-opacity" as any]: env.shadowOpacity.toFixed(3),
    ["--shadow-tint" as any]: env.shadowTint,
    ["--shadow-rgb" as any]: hexToTriplet(env.shadowTint),
    // Surface
    ["--surface-warmth" as any]: env.surfaceWarmth.toFixed(3),
    ["--surface-tint" as any]: env.surfaceTint,
    ["--surface-rgb" as any]: hexToTriplet(env.surfaceTint),
    // Sky
    ["--background-start" as any]: env.backgroundStart,
    ["--background-end" as any]: env.backgroundEnd,
    ["--background-horizon" as any]: env.backgroundHorizon,
    ["--horizon-rgb" as any]: hexToTriplet(env.backgroundHorizon),
    // Light
    ["--highlight-opacity" as any]: env.highlightOpacity.toFixed(3),
    ["--ambient-contrast" as any]: env.ambientContrast.toFixed(3),
    ["--glow" as any]: env.glow.toFixed(3),
    // Sun position
    ["--sun-x" as any]: `${(env.sunScreenX * 100).toFixed(2)}%`,
    ["--sun-y" as any]: `${(env.sunScreenY * 100).toFixed(2)}%`,
    ["--is-day" as any]: env.isDay ? 1 : 0,
    // Depth
    ["--depth-px" as any]: `${env.depthPx.toFixed(2)}px`,
    ["--depth-dir-x" as any]: env.depthDirX.toFixed(3),
    ["--depth-dir-y" as any]: env.depthDirY.toFixed(3),
    // Unitless depth scalar (0..1) — multiplies the sitting-mode flat
    // shadow length so increasing depth makes the projection grow.
    ["--depth-scale" as any]: (inputs.depth / 100).toFixed(3),
    // Extra offset below the tile — shifts the entire slab + shadow
    // anchor downward so the side walls peek out further.
    ["--slab-offset" as any]: `${env.slabOffset.toFixed(2)}px`,
    // Shadow extras
    ["--shadow-spread" as any]: `${env.shadowSpread.toFixed(2)}px`,
    ["--shadow-contact-mul" as any]: env.shadowContactMul.toFixed(3),
    ["--shadow-reach-mul" as any]: env.shadowReachMul.toFixed(3),
    ["--shadow-distance-drop" as any]: `${env.shadowDistanceDrop.toFixed(2)}px`,
    // Surface mode — floating tiles show slab thickness + offset cast shadow,
    // sitting tiles collapse the depth visually so the shadow comes straight
    // off the tile edge.
    ["--floating-mul" as any]: style.surfaceMode === "floating" ? 1 : 0,
    // ── Style tokens (no computation, just user preferences) ─────────────
    ["--corner-radius" as any]: (style.cornerRadius / 100).toFixed(3),
    ["--highlight-mul" as any]: (style.highlight / 100).toFixed(3),
    ["--gloss" as any]: (style.gloss / 100).toFixed(3),
    // Surface opacity drops dramatically with Sun gaze — at full gaze the
    // tile fill is ~25% opaque, becoming frosted/liquid glass that the
    // wallpaper refracts through (the backdrop-blur scales inversely with
    // opacity, so this also bumps the refraction).
    ["--surface-opacity" as any]: (
      style.surfaceOpacity * (1 - env.sunGaze * 0.75)
    ).toFixed(2),
    ["--sun-gaze" as any]: env.sunGaze.toFixed(3),
    // Gaze disc (visible behind the phone when enabled) and the light
    // direction it implies. --gaze-dir-x/y use the same sign convention
    // as --shadow-x/y: positive X = light from the left, positive Y =
    // light from above.
    ["--gaze-enabled" as any]: env.gazeEnabled,
    ["--gaze-disc-x" as any]: `${(env.gazeDiscX * 100).toFixed(2)}%`,
    ["--gaze-disc-y" as any]: `${(env.gazeDiscY * 100).toFixed(2)}%`,
    ["--gaze-dir-x" as any]: env.gazeDirX.toFixed(3),
    ["--gaze-dir-y" as any]: env.gazeDirY.toFixed(3),
    ["--pillow" as any]: style.pillow.toFixed(2),
    ["--saturation" as any]: (style.saturation / 100).toFixed(3),
    ["--tile-gap" as any]: `${style.tileGap}px`,
    ["--wallpaper-warm" as any]: (style.wallpaperWarm / 100).toFixed(3),
    ["--bezel-sheen" as any]: (style.bezelSheen / 100).toFixed(3),
    ["--glyph-weight" as any]: (style.glyphWeight / 100).toFixed(3),
  };

  return (
    <div className="app" style={styleVars}>
      <div className="sky">
        <div className="sky-haze" />
        <div className="sun-disc" aria-hidden />
        {env.gazeEnabled === 1 && (
          <div
            className={`gaze-disc gaze-disc--${env.gazeMode}`}
            aria-hidden
          />
        )}
      </div>

      <button
        className="about-pill"
        onClick={() => setAboutOpen(true)}
        type="button"
      >
        <span className="about-pill-dot" aria-hidden />
        About
      </button>

      <main className="layout">
        <section className="stage">
          <Phone tiltX={inputs.tiltX} tiltY={inputs.tiltY} hour={inputs.hour} />
          <div className="ground" aria-hidden />
        </section>

        <section className="panel">
          <Controls
            inputs={inputs}
            style={style}
            onChange={setInputs}
            onStyleChange={setStyle}
            onPreset={(name) => setInputs(PRESETS[name])}
            env={env}
          />
        </section>
      </main>

      {aboutOpen && <About onClose={() => setAboutOpen(false)} />}
    </div>
  );
}
