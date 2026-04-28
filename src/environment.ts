// TrueShadow environment engine.
// Maps a few simple inputs (time of day, cloud cover, device tilt) into the
// CSS tokens that drive every elevated surface in the UI: a single light
// vector that gets translated into shadow x/y/blur/opacity, plus warmth,
// highlight strength, ambient contrast, and the sky behind the phone.

export interface Inputs {
  hour: number;             // 0–24
  clouds: number;           // 0–100
  tiltX: number;            // -30..30 (yaw — left/right)
  tiltY: number;            // -30..30 (pitch — up/down)
  // Phone pose toward the sun (or moon). Gated by sunGazeEnabled — when
  // disabled, the gaze layers are completely off regardless of intensity.
  //   sunGaze:         0..100 — intensity (how directly the phone faces it).
  //   sunGazeEnabled:  master toggle for the whole gaze system.
  //   sunGazeMode:     "sun" (warm) or "moon" (cool).
  //   sunGazePosition: 0..100 — where in the sky the gaze sun/moon sits.
  //                    0 = rising at horizon, 50 = peak, 100 = setting.
  sunGaze: number;
  sunGazeEnabled: boolean;
  sunGazeMode: "sun" | "moon";
  sunGazePosition: number;
  // Phone heading — 0..360 degrees of rotation around the screen's normal
  // axis. 0 = the default orientation; rotating the compass effectively
  // rotates the world relative to the phone, so shadows in the phone's
  // frame rotate by -compassHeading (CCW for positive headings).
  compassHeading: number;
  depth: number;            // 0..100 — z-elevation of tiles above wallpaper
  depthOffset: number;      // -10..30 — extra px the slab is offset below the
                            //           tile, so the side walls peek out
                            //           further from underneath
  // ── Shadow tuning ─────────────────────────────────────────────────────
  shadowIntensity: number;  // 0..200 — overall cast-shadow opacity multiplier
  shadowLength: number;     // 0..300 — cast-shadow magnitude (X/Y) multiplier
  shadowSoftness: number;   // 0..300 — blur multiplier
  shadowSpread: number;     // -12..12 — extra spread radius (px)
  shadowTintShift: number;  // -50..50 — cool ↔ warm shift on shadow color
  shadowContact: number;    // 0..200 — close contact shadow strength
  shadowReach: number;      // 0..200 — far/long secondary cast strength
  shadowAngleOffset: number;// -45..45 — degrees of angle offset
  shadowDistance: number;   // 0..100  — perceived elevation above the surface
                            //           (more = bigger, blurrier, more dropped)
}

export interface Environment {
  // CSS tokens
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowOpacity: number;
  shadowTint: string;
  surfaceWarmth: number;   // 0..1, drives icon/widget tint
  surfaceTint: string;     // resolved tint color
  backgroundStart: string;
  backgroundEnd: string;
  backgroundHorizon: string;
  highlightOpacity: number;
  ambientContrast: number; // 0.6..1.1
  glow: number;            // 0..1, sun glow intensity
  sunGaze: number;         // 0..1 — effective gaze intensity (0 if disabled)
  gazeEnabled: number;     // 0 or 1 — drives disc visibility
  gazeMode: "sun" | "moon";
  gazeDiscX: number;       // 0..1 — gaze disc viewport X
  gazeDiscY: number;       // 0..1 — gaze disc viewport Y
  gazeDirX: number;        // -1..1 — light direction X (positive = sun on left)
  gazeDirY: number;        // -1..1 — light direction Y (positive = sun above)
  // Depth — surfaces have physical thickness, with side walls cast in the
  // same direction as the shadow vector.
  depthPx: number;
  depthDirX: number;       // unit vector, follows light → shadow direction
  depthDirY: number;
  // Shadow extras (passed straight to CSS, not applied in compute).
  shadowSpread: number;     // px to add to spread radius
  shadowContactMul: number; // multiplier on contact shadow opacity
  shadowReachMul: number;   // multiplier on long secondary cast opacity
  shadowDistanceDrop: number; // px of perpendicular drop added by distance
  slabOffset: number;       // px the slab and shadow base shifts down
  // Debug / scene
  altitude: number;        // 0..1 normalized
  azimuth: number;         // -1..1 (left to right)
  sunScreenX: number;      // 0..1 across viewport
  sunScreenY: number;      // 0..1, 0=top, 1=horizon
  isDay: boolean;
  phase: Phase;
}

export type Phase =
  | "Night"
  | "Pre-dawn"
  | "Dawn"
  | "Morning"
  | "Noon"
  | "Afternoon"
  | "Golden Hour"
  | "Dusk";

const SUNRISE = 5.5;
const SUNSET = 18.5;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(lerp(ar, br, t), lerp(ag, bg, t), lerp(ab, bb, t));
}

// Sky keyframes — "top" is overhead, "bot" is horizon, "horizon" is tint near sun.
type Key = { h: number; top: string; bot: string; horizon: string };
const SKY: Key[] = [
  { h: 0,    top: "#070a18", bot: "#0a0c1c", horizon: "#0b0f24" },
  { h: 4.5,  top: "#0e1330", bot: "#1c213d", horizon: "#3b3656" },
  { h: 6,    top: "#3a3a66", bot: "#d68b62", horizon: "#f4a877" },
  { h: 7.5,  top: "#7896b8", bot: "#f3c89a", horizon: "#fadcb0" },
  { h: 10,   top: "#a4c2dd", bot: "#e9eef2", horizon: "#f1eadb" },
  { h: 12,   top: "#7fb1d8", bot: "#dbe7ee", horizon: "#eef3f5" },
  { h: 15,   top: "#8db5d3", bot: "#e7ddc4", horizon: "#f0e0c2" },
  { h: 17.5, top: "#5b6c97", bot: "#f1a472", horizon: "#fbc285" },
  { h: 18.6, top: "#312a52", bot: "#c66a6a", horizon: "#e69072" },
  { h: 19.5, top: "#161734", bot: "#5a3554", horizon: "#83446a" },
  { h: 21.5, top: "#0a0d22", bot: "#0e1128", horizon: "#1a1736" },
  { h: 24,   top: "#070a18", bot: "#0a0c1c", horizon: "#0b0f24" },
];

function sampleSky(hour: number): { top: string; bot: string; horizon: string } {
  const h = ((hour % 24) + 24) % 24;
  let a = SKY[0];
  let b = SKY[SKY.length - 1];
  for (let i = 0; i < SKY.length - 1; i++) {
    if (h >= SKY[i].h && h <= SKY[i + 1].h) {
      a = SKY[i];
      b = SKY[i + 1];
      break;
    }
  }
  const t = (h - a.h) / Math.max(0.0001, b.h - a.h);
  return {
    top: mix(a.top, b.top, t),
    bot: mix(a.bot, b.bot, t),
    horizon: mix(a.horizon, b.horizon, t),
  };
}

function detectPhase(hour: number, altitude: number): Phase {
  if (hour < 4.5 || hour >= 21) return "Night";
  if (hour < 5.5) return "Pre-dawn";
  if (hour < 7) return "Dawn";
  if (hour < 11 && altitude < 0.85) return "Morning";
  if (hour < 13.5) return "Noon";
  if (hour < 16.5) return "Afternoon";
  if (hour < 18.7) return "Golden Hour";
  return "Dusk";
}

export function computeEnvironment(input: Inputs): Environment {
  const {
    hour,
    clouds,
    tiltX,
    tiltY,
    depth,
    shadowIntensity,
    shadowLength,
    shadowSoftness,
    shadowSpread,
    shadowTintShift,
    shadowContact,
    shadowReach,
    shadowAngleOffset,
    shadowDistance,
    sunGaze,
    sunGazeEnabled,
    sunGazeMode,
    sunGazePosition,
    compassHeading,
    depthOffset,
  } = input;
  const isDay = hour >= SUNRISE && hour <= SUNSET;

  // Sun position. Altitude rises from sunrise to noon and falls back. Azimuth
  // travels from -1 (sunrise, left) through 0 (noon, behind viewer) to +1
  // (sunset, right).
  let altitude = 0;
  let azimuth = 0;
  if (isDay) {
    const progress = (hour - SUNRISE) / (SUNSET - SUNRISE); // 0..1
    altitude = Math.sin(progress * Math.PI);
    azimuth = -Math.cos(progress * Math.PI);
  } else {
    // Moon — gentle inverse arc, much weaker.
    const nightHour = hour < SUNRISE ? hour + 24 : hour;
    const p = (nightHour - SUNSET) / (24 + SUNRISE - SUNSET);
    altitude = -Math.sin(p * Math.PI) * 0.6;
    azimuth = -Math.cos(p * Math.PI);
  }

  const cloud = clamp(clouds / 100, 0, 1);

  // Tilt nudges the perceived light direction relative to the phone's surface.
  // Tilting the phone right (positive tiltX) brings its right edge toward the
  // viewer, which from the surface's frame of reference is equivalent to the
  // light shifting left.
  const tiltLightX = -tiltX / 55;
  const tiltLightY = tiltY / 55;

  const lightX = clamp(azimuth + tiltLightX, -1.4, 1.4);
  const lightAlt = clamp(altitude + tiltLightY, -1, 1);

  // Shadow magnitude: longer when sun is low, dampened by clouds.
  const altAbs = Math.abs(lightAlt);
  const baseMag = isDay
    ? lerp(38, 14, Math.pow(altAbs, 0.85)) // 38px at horizon → 14px at noon
    : 7 + (1 - altAbs) * 4;
  const cloudDamp = isDay ? 1 - cloud * 0.55 : 1 - cloud * 0.35;
  const shadowMag = baseMag * cloudDamp;

  // Decompose into x/y. X follows -lightX (shadow opposite the sun). Y is the
  // surface drop — always positive (shadow falls onto the screen surface) and
  // grows as the sun lowers.
  const rawShadowX = -lightX * shadowMag * 0.85;
  const dropFactor = isDay ? lerp(0.45, 1.05, 1 - altAbs) : 0.55;
  const rawShadowY = dropFactor * shadowMag;

  // User shadow-length multiplier — scales the offset (not the opacity), so
  // shadows grow longer/shorter regardless of cloud or time of day. The
  // natural arc is preserved (longer at horizon), this just amplifies it.
  const lengthMul = clamp(shadowLength / 100, 0, 3);
  const scaledX = rawShadowX * lengthMul;
  const scaledY = rawShadowY * lengthMul;

  // Compass + angle offset combined into a single rotation of the shadow
  // vector. Compass heading represents the phone's rotation around the
  // screen normal — when the phone rotates clockwise, the world (and the
  // sun's bearing) rotates counter-clockwise from the phone's frame, so
  // we apply CCW rotation by compassHeading degrees. The fine angle-offset
  // slider is added on top.
  const totalRotationDeg = compassHeading + shadowAngleOffset;
  const totalRad = (totalRotationDeg * Math.PI) / 180;
  const cosA = Math.cos(totalRad);
  const sinA = Math.sin(totalRad);
  const shadowX = scaledX * cosA - scaledY * sinA;
  const shadowY = scaledX * sinA + scaledY * cosA;

  // Blur: clouds add diffusion, low sun adds a touch as well. Softness slider
  // multiplies the result, distance adds extra blur on top — the further the
  // tile sits above the surface, the more diffused its shadow.
  const softnessMul = clamp(shadowSoftness / 100, 0, 3);
  const distance = clamp(shadowDistance, 0, 200);
  const distanceBlurAdd = distance * 0.5; // px
  const shadowBlur =
    (10 + cloud * 34 + (1 - altAbs) * (isDay ? 14 : 6) + (isDay ? 0 : 4)) *
      softnessMul +
    distanceBlurAdd;

  // Opacity: contact shadow stays present at noon; long horizon shadows are
  // softer per-px but cover more area, so opacity dips slightly. Clouds cut it.
  const baseOpacity = isDay
    ? lerp(0.28, 0.18, 1 - altAbs)
    : 0.16;
  // Apply user shadow-intensity multiplier on top of the natural lighting.
  // Slider is 0..200 (% of natural). 0 = no cast shadow, 200 = double.
  const intensityMul = clamp(shadowIntensity / 100, 0, 2);
  // Sun gaze fades cast shadow on the screen — when the phone faces the sun,
  // the sun is in front of the UI, not above it, so it casts almost no shadow
  // *on* the screen surface. Night automatically forces moon gaze on with a
  // baseline intensity so the night view always reads as glassy moonlight
  // rather than a saturated dark UI.
  const isNight = !isDay;
  const gazeOnByNight = isNight;
  const gazeActive = sunGazeEnabled || gazeOnByNight;
  const userGazeFraction = clamp(sunGaze / 100, 0, 1);
  const gaze = gazeActive
    ? isNight
      ? Math.max(userGazeFraction, 0.45)
      : userGazeFraction
    : 0;
  const gazeShadowMul = 1 - gaze * 0.7;
  const shadowOpacity = clamp(
    baseOpacity * (1 - cloud * 0.55) * intensityMul * gazeShadowMul,
    0,
    0.6
  );

  // Shadow tint — warm rubbed-bronze near horizon, neutral charcoal at midday,
  // deep blue at night.
  const horizonShadow = "#3a1f10";
  const noonShadow = "#0e1116";
  const nightShadow = "#040814";
  let shadowTint: string;
  if (isDay) {
    shadowTint = mix(horizonShadow, noonShadow, Math.pow(altAbs, 0.7));
  } else {
    shadowTint = nightShadow;
  }
  // User tint shift — push the shadow color warmer or cooler. Positive values
  // mix toward a warm umber; negative values mix toward a cool indigo.
  const tintShiftClamped = clamp(shadowTintShift, -50, 50);
  if (tintShiftClamped > 0) {
    shadowTint = mix(shadowTint, "#6a2818", (tintShiftClamped / 50) * 0.45);
  } else if (tintShiftClamped < 0) {
    shadowTint = mix(shadowTint, "#0a1a3a", (-tintShiftClamped / 50) * 0.45);
  }

  // Surface warmth (0 = cool/blue, 1 = warm/amber). Warmest at horizon, coolest
  // at noon, deeply cool at night. Clouds desaturate toward neutral.
  const dayWarmth = isDay ? lerp(0.95, 0.18, Math.pow(altAbs, 0.7)) : 0.05;
  const surfaceWarmth = clamp(dayWarmth * (1 - cloud * 0.5), 0, 1);

  const warmTone = "#f5d6a8";
  const coolTone = "#cad9e8";
  const nightTone = "#3a4868";
  const surfaceTint = isDay
    ? mix(coolTone, warmTone, surfaceWarmth)
    : nightTone;

  // Sky.
  const sky = sampleSky(hour);
  // Clouds desaturate sky toward a soft gray.
  const cloudGrayTop = "#9aa4ad";
  const cloudGrayBot = "#cdd2d7";
  const cloudGrayHorizon = "#dfe2e5";
  const backgroundStart = mix(sky.top, cloudGrayTop, cloud * 0.7);
  const backgroundEnd = mix(sky.bot, cloudGrayBot, cloud * 0.6);
  const backgroundHorizon = mix(sky.horizon, cloudGrayHorizon, cloud * 0.65);

  // Highlights: sharper when light is direct, muted under clouds and at night.
  // Sun gaze boosts highlights — facing the sun directly puts more light on
  // every facet of the surface.
  const highlightOpacity = clamp(
    (isDay ? 0.55 : 0.18) *
      (1 - cloud * 0.7) *
      (0.4 + altAbs * 0.7) *
      (1 + gaze * 0.55),
    0.05,
    0.95
  );

  // Ambient contrast: 1.0 = normal, drops under clouds and at night.
  const ambientContrast = clamp(
    (isDay ? 1.0 : 0.78) * (1 - cloud * 0.18),
    0.6,
    1.1
  );

  // Sun glow strength.
  const glow = clamp((isDay ? altAbs : 0.15) * (1 - cloud * 0.85), 0, 1);

  // Project sun onto the viewport for the indicator. azimuth -1..1 → 0..1.
  const sunScreenX = clamp(0.5 + azimuth * 0.42, 0, 1);
  // altitude 0 (horizon) → y near 0.78, altitude 1 (zenith) → y near 0.08.
  const sunScreenY = clamp(0.82 - altitude * 0.74, 0.05, 0.95);

  // Depth — physical thickness of UI tiles. Side walls extend straight
  // downward so increasing depth makes the tile feel thicker without
  // visually shifting it to the side. (The cast shadow already encodes the
  // light direction; depth just describes how far the slab protrudes.)
  //
  // Tilt amplifies the visible side-wall — face-on you'd really only see
  // the top face; as the user tilts the phone the side becomes more
  // prominent. We boost --depth-dir-y with |tiltY|/30 so changing the
  // y-tilt visibly shifts how thick the tiles read.
  const tiltYNorm = clamp(Math.abs(tiltY) / 30, 0, 1);
  const depthPx = clamp(depth / 100, 0, 1) * 12;
  const depthDirX = 0;
  const depthDirY = 1 + tiltYNorm * 1.4;

  return {
    shadowX,
    shadowY,
    shadowBlur,
    shadowOpacity,
    shadowTint,
    surfaceWarmth,
    surfaceTint,
    backgroundStart,
    backgroundEnd,
    backgroundHorizon,
    highlightOpacity,
    ambientContrast,
    glow,
    altitude,
    azimuth,
    sunScreenX,
    sunScreenY,
    isDay,
    phase: detectPhase(hour, altitude),
    depthPx,
    depthDirX,
    depthDirY,
    shadowSpread: clamp(shadowSpread, -20, 20),
    shadowContactMul: clamp(shadowContact / 100, 0, 3),
    shadowReachMul: clamp(shadowReach / 100, 0, 3),
    shadowDistanceDrop: distance * 0.35,
    sunGaze: gaze,
    slabOffset: clamp(depthOffset, -20, 40),
    // Night promotes the gaze system to "moon" automatically so the screen
    // settles into a moonlit glass mood rather than a saturated dark UI.
    ...computeGaze(
      gazeActive,
      isNight ? "moon" : sunGazeMode,
      sunGazePosition
    ),
  };
}

// Compute the gaze disc position and light direction. Position is mapped
// across an arc above the horizon: 0 = rising on the left, 50 = peak,
// 100 = setting on the right. Moon mode flattens the arc slightly so the
// moon never quite reaches the same overhead point as the sun.
function computeGaze(
  enabled: boolean,
  mode: "sun" | "moon",
  position: number
) {
  const posNorm = clamp(position / 100, 0, 1);
  const alt = Math.sin(posNorm * Math.PI);
  const azim = -Math.cos(posNorm * Math.PI);
  const moonMul = mode === "moon" ? 0.82 : 1;
  const effectiveAlt = alt * moonMul;
  const gazeDiscX = clamp(0.5 + azim * 0.42, 0.04, 0.96);
  const gazeDiscY = clamp(0.82 - effectiveAlt * 0.74, 0.05, 0.95);
  // Light direction (relative to phone center). Sign matches the existing
  // convention used for cast shadows: positive X = light from the left
  // (shadow goes right), positive Y = light from above (shadow goes down).
  const gazeDirX = -(gazeDiscX - 0.5) * 2;
  const gazeDirY = -(gazeDiscY - 0.5) * 2;
  return {
    gazeEnabled: enabled ? 1 : 0,
    gazeMode: mode,
    gazeDiscX,
    gazeDiscY,
    gazeDirX,
    gazeDirY,
  };
}

// Presets keep tilts and sun gaze at 0 — they describe environmental
// conditions, not pose. Users can tilt the phone or lift it toward the sun
// independently to see how surfaces respond.
//
// Time-of-day presets are intentionally label-only ("Early morning") rather
// than time-stamped — actual local time depends on where you are in the
// world. The hour value is just what shapes the lighting curve.
const POSE_BASE = {
  sunGaze: 0,
  sunGazeEnabled: false,
  sunGazeMode: "sun" as const,
  sunGazePosition: 50,
  compassHeading: 0,
  depthOffset: 0,
};
const SHADOW_BASE = {
  shadowSoftness: 100,
  shadowSpread: 0,
  shadowTintShift: 0,
  shadowContact: 100,
  shadowReach: 100,
  shadowAngleOffset: 0,
  shadowDistance: 0,
};
export const PRESETS: Record<string, Inputs> = {
  // Row 1 — times of day.
  "Early morning":{ hour: 7.5,  clouds: 12, tiltX: 0, tiltY: 0, depth: 50, shadowIntensity: 105, shadowLength: 180, ...POSE_BASE, ...SHADOW_BASE, shadowTintShift: 8  },
  "Midday":       { hour: 12.5, clouds: 8,  tiltX: 0, tiltY: 0, depth: 45, shadowIntensity: 100, shadowLength: 80,  ...POSE_BASE, ...SHADOW_BASE                       },
  "Afternoon":    { hour: 15.5, clouds: 10, tiltX: 0, tiltY: 0, depth: 50, shadowIntensity: 105, shadowLength: 140, ...POSE_BASE, ...SHADOW_BASE, shadowTintShift: 6  },
  "Last light":   { hour: 18.0, clouds: 8,  tiltX: 0, tiltY: 0, depth: 55, shadowIntensity: 115, shadowLength: 240, ...POSE_BASE, ...SHADOW_BASE, shadowTintShift: 18 },
  // Row 2 — sky/atmosphere variables that sit on top of any time of day.
  "Overcast":     { hour: 13,   clouds: 90, tiltX: 0, tiltY: 0, depth: 45, shadowIntensity: 100, shadowLength: 75,  ...POSE_BASE, ...SHADOW_BASE, shadowSoftness: 140 },
  "Moonlight":    { hour: 22.5, clouds: 25, tiltX: 0, tiltY: 0, depth: 35, shadowIntensity: 90,  shadowLength: 100, ...POSE_BASE, ...SHADOW_BASE, shadowTintShift: -22 },
};

// Rows in display order — Controls renders each row as its own line so the
// two semantic groups read distinctly.
export const PRESET_ROWS: string[][] = [
  ["Early morning", "Midday", "Afternoon", "Last light"],
  ["Overcast", "Moonlight"],
];
