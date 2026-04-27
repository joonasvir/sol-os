// Surface style is independent of environment. The environment engine
// computes lighting; these tokens describe the *material* the lighting falls
// on — radius, gloss, translucency, convexity, etc. They flow straight into
// CSS variables without any computation.

export type SurfaceMode = "floating" | "sitting";

export interface Style {
  cornerRadius: number;   // 60..160  — multiplier on base corner radius
  highlight: number;      // 0..200   — multiplier on every highlight
  gloss: number;          // 0..100   — matte (0) ↔ shiny (100)
  surfaceOpacity: number; // 70..100  — tile fill opacity (translucency)
  pillow: number;         // 0..100   — convex inner shadow strength
  saturation: number;     // 50..150  — color saturation %
  tileGap: number;        // 6..24    — px gap between tiles
  wallpaperWarm: number;  // -50..50  — extra warmth offset on the wallpaper
  bezelSheen: number;     // 0..100   — phone bezel reflection strength
  glyphWeight: number;    // 50..130  — opacity of the icon glyphs
  // Surface mode: "floating" tiles have visible slab thickness and a cast
  // shadow offset by the depth; "sitting" tiles are flush against the
  // wallpaper with the shadow projecting directly from the tile edge.
  surfaceMode: SurfaceMode;
}

export const DEFAULT_STYLE: Style = {
  cornerRadius: 87,
  highlight: 200,
  gloss: 20,
  surfaceOpacity: 100,
  pillow: 17,
  saturation: 132,
  tileGap: 20,
  wallpaperWarm: 2,
  bezelSheen: 54,
  glyphWeight: 130,
  surfaceMode: "floating",
};
