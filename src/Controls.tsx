import { useEffect, useRef, useState } from "react";
import type { Environment, Inputs } from "./environment";
import { PRESET_ROWS } from "./environment";
import type { Style, SurfaceMode } from "./style";

// How fast the time-of-day playhead advances when "play" is on.
// 0.5 hours per second = a full 24-hour cycle in 48 s.
const PLAY_SPEED_HOURS_PER_SECOND = 0.5;

interface Props {
  inputs: Inputs;
  style: Style;
  onChange: (next: Inputs) => void;
  onStyleChange: (next: Style) => void;
  onPreset: (name: string) => void;
  env: Environment;
}

function fmtHour(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

export function Controls({
  inputs,
  style,
  onChange,
  onStyleChange,
  onPreset,
  env,
}: Props) {
  const [shadowOpen, setShadowOpen] = useState(false);
  const [surfaceOpen, setSurfaceOpen] = useState(false);
  const [timePlaying, setTimePlaying] = useState(false);

  const setIn = <K extends keyof Inputs>(k: K, v: Inputs[K]) =>
    onChange({ ...inputs, [k]: v });
  const setSt = <K extends keyof Style>(k: K, v: number) =>
    onStyleChange({ ...style, [k]: v });

  // Mirror inputs into a ref so the rAF tick can read the latest hour
  // without forcing the effect to restart every frame.
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;

  useEffect(() => {
    if (!timePlaying) return;
    let frameId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const cur = inputsRef.current;
      const next = (cur.hour + dt * PLAY_SPEED_HOURS_PER_SECOND) % 24;
      onChange({ ...cur, hour: next });
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [timePlaying, onChange]);

  return (
    <div className="controls">
      <div className="presets">
        {PRESET_ROWS.map((row, rowIndex) => (
          <div className="preset-row" key={rowIndex}>
            {row.map((name) => (
              <button
                key={name}
                className="preset"
                onClick={() => onPreset(name)}
                type="button"
              >
                {name}
              </button>
            ))}
          </div>
        ))}
      </div>

      <Slider
        label="Time of day"
        value={inputs.hour}
        min={0}
        max={24}
        step={0.05}
        format={fmtHour}
        onChange={(v) => setIn("hour", v)}
        onInteract={() => setTimePlaying(false)}
        trailing={
          <div className="time-play-controls" aria-label="Play time">
            <button
              type="button"
              className="time-play-btn"
              data-active={timePlaying ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setTimePlaying(true);
              }}
              aria-label="Play time"
              aria-pressed={timePlaying}
            >
              <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden>
                <polygon points="3,2 8,5 3,8" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              className="time-play-btn"
              data-active={!timePlaying ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setTimePlaying(false);
              }}
              aria-label="Stop time"
              aria-pressed={!timePlaying}
            >
              <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden>
                <rect x="3" y="3" width="4" height="4" fill="currentColor" />
              </svg>
            </button>
          </div>
        }
      />
      <Slider
        label="Tilt X"
        value={inputs.tiltX}
        min={-30}
        max={30}
        step={0.5}
        format={(v) => `${v.toFixed(1)}°`}
        onChange={(v) => setIn("tiltX", v)}
        resetValue={0}
      />
      <Slider
        label="Tilt Y"
        value={inputs.tiltY}
        min={-30}
        max={30}
        step={0.5}
        format={(v) => `${v.toFixed(1)}°`}
        onChange={(v) => setIn("tiltY", v)}
        resetValue={0}
      />
      <Slider
        label="Cloud cover"
        value={inputs.clouds}
        min={0}
        max={100}
        step={1}
        format={(v) => `${Math.round(v)}%`}
        onChange={(v) => setIn("clouds", v)}
      />
      <Slider
        label="Depth"
        value={inputs.depth}
        min={0}
        max={100}
        step={1}
        format={(v) => `${Math.round(v)}%`}
        onChange={(v) => setIn("depth", v)}
      />
      <Slider
        label="Depth offset"
        value={inputs.depthOffset}
        min={-10}
        max={30}
        step={0.5}
        format={(v) =>
          v === 0 ? "Flush" : `${v > 0 ? "+" : ""}${v.toFixed(1)}px`
        }
        onChange={(v) => setIn("depthOffset", v)}
        resetValue={0}
      />

      <SegmentedToggle
        label="Surface contact"
        value={style.surfaceMode}
        options={[
          { value: "floating" as SurfaceMode, label: "Floating" },
          { value: "sitting" as SurfaceMode, label: "Sitting" },
        ]}
        onChange={(v) => onStyleChange({ ...style, surfaceMode: v })}
      />

      <div className="gaze-section">
        <div className="gaze-section-head">
          <span className="gaze-section-title">
            {inputs.sunGazeMode === "moon" ? "Moon gaze" : "Sun gaze"}
          </span>
          <Switch
            checked={inputs.sunGazeEnabled}
            onChange={(v) => setIn("sunGazeEnabled", v)}
          />
        </div>
        {inputs.sunGazeEnabled && (
          <div className="gaze-section-body">
            <SegmentedToggle
              value={inputs.sunGazeMode}
              options={[
                { value: "sun" as const, label: "Sun" },
                { value: "moon" as const, label: "Moon" },
              ]}
              onChange={(v) => setIn("sunGazeMode", v)}
            />
            <Slider
              label={
                inputs.sunGazeMode === "moon" ? "Moon position" : "Sun position"
              }
              value={inputs.sunGazePosition}
              min={0}
              max={100}
              step={0.5}
              format={(v) => {
                const label = inputs.sunGazeMode === "moon" ? "Moon" : "Sun";
                if (v < 5) return `${label}rise`;
                if (v > 95) return `${label}set`;
                if (v >= 47 && v <= 53)
                  return inputs.sunGazeMode === "moon" ? "Mid-night" : "Noon";
                return `${Math.round(v)}%`;
              }}
              onChange={(v) => setIn("sunGazePosition", v)}
              resetValue={50}
            />
            <Slider
              label="Intensity"
              value={inputs.sunGaze}
              min={0}
              max={100}
              step={1}
              format={(v) => `${Math.round(v)}%`}
              onChange={(v) => setIn("sunGaze", v)}
            />
          </div>
        )}
      </div>

      <CollapsibleToggle
        label="Shadow tuning"
        meta={shadowOpen ? "Hide" : "9 controls"}
        open={shadowOpen}
        onClick={() => setShadowOpen((v) => !v)}
      />
      {shadowOpen && (
        <div className="advanced-section">
          <Slider
            label="Distance"
            value={inputs.shadowDistance}
            min={0}
            max={100}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setIn("shadowDistance", v)}
          />
          <Slider
            label="Length"
            value={inputs.shadowLength}
            min={0}
            max={300}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setIn("shadowLength", v)}
          />
          <Slider
            label="Opacity"
            value={inputs.shadowIntensity}
            min={0}
            max={200}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setIn("shadowIntensity", v)}
          />
          <Slider
            label="Softness"
            value={inputs.shadowSoftness}
            min={0}
            max={300}
            step={1}
            format={(v) =>
              v < 40 ? "Crisp" : v > 200 ? "Diffuse" : `${Math.round(v)}%`
            }
            onChange={(v) => setIn("shadowSoftness", v)}
          />
          <Slider
            label="Tint"
            value={inputs.shadowTintShift}
            min={-50}
            max={50}
            step={1}
            format={(v) =>
              v === 0
                ? "Neutral"
                : v > 0
                ? `+${Math.round(v)} warm`
                : `${Math.round(v)} cool`
            }
            onChange={(v) => setIn("shadowTintShift", v)}
          />
          <Slider
            label="Spread"
            value={inputs.shadowSpread}
            min={-12}
            max={12}
            step={0.5}
            format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}px`}
            onChange={(v) => setIn("shadowSpread", v)}
          />
          <Slider
            label="Contact"
            value={inputs.shadowContact}
            min={0}
            max={200}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setIn("shadowContact", v)}
          />
          <Slider
            label="Reach"
            value={inputs.shadowReach}
            min={0}
            max={200}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setIn("shadowReach", v)}
          />
          <Slider
            label="Angle offset"
            value={inputs.shadowAngleOffset}
            min={-45}
            max={45}
            step={0.5}
            format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}°`}
            onChange={(v) => setIn("shadowAngleOffset", v)}
          />
        </div>
      )}

      <CollapsibleToggle
        label="Surface tuning"
        meta={surfaceOpen ? "Hide" : "10 controls"}
        open={surfaceOpen}
        onClick={() => setSurfaceOpen((v) => !v)}
      />
      {surfaceOpen && (
        <div className="advanced-section">
          <Slider
            label="Corner radius"
            value={style.cornerRadius}
            min={50}
            max={170}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setSt("cornerRadius", v)}
          />
          <Slider
            label="Highlight"
            value={style.highlight}
            min={0}
            max={200}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setSt("highlight", v)}
          />
          <Slider
            label="Matte ↔ Shiny"
            value={style.gloss}
            min={0}
            max={100}
            step={1}
            format={(v) =>
              v < 25 ? "Matte" : v > 75 ? "Shiny" : `${Math.round(v)}%`
            }
            onChange={(v) => setSt("gloss", v)}
          />
          <Slider
            label="Surface opacity"
            value={style.surfaceOpacity}
            min={50}
            max={100}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setSt("surfaceOpacity", v)}
          />
          <Slider
            label="Pillow"
            value={style.pillow}
            min={0}
            max={100}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setSt("pillow", v)}
          />
          <Slider
            label="Saturation"
            value={style.saturation}
            min={50}
            max={150}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setSt("saturation", v)}
          />
          <Slider
            label="Tile gap"
            value={style.tileGap}
            min={4}
            max={28}
            step={1}
            format={(v) => `${Math.round(v)}px`}
            onChange={(v) => setSt("tileGap", v)}
          />
          <Slider
            label="Wallpaper warmth"
            value={style.wallpaperWarm}
            min={-50}
            max={50}
            step={1}
            format={(v) => (v === 0 ? "Neutral" : `${v > 0 ? "+" : ""}${Math.round(v)}`)}
            onChange={(v) => setSt("wallpaperWarm", v)}
          />
          <Slider
            label="Bezel sheen"
            value={style.bezelSheen}
            min={0}
            max={100}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setSt("bezelSheen", v)}
          />
          <Slider
            label="Glyph weight"
            value={style.glyphWeight}
            min={50}
            max={130}
            step={1}
            format={(v) => `${Math.round(v)}%`}
            onChange={(v) => setSt("glyphWeight", v)}
          />
        </div>
      )}

      <div className="debug">
        <div className="debug-row">
          <span className="debug-label">Phase</span>
          <span className="debug-value">{env.phase}</span>
        </div>
        <div className="debug-row">
          <span className="debug-label">Sun altitude</span>
          <span className="debug-value">{env.altitude.toFixed(2)}</span>
        </div>
        <div className="debug-row">
          <span className="debug-label">Azimuth</span>
          <span className="debug-value">{env.azimuth.toFixed(2)}</span>
        </div>
        <div className="debug-row">
          <span className="debug-label">Shadow X / Y</span>
          <span className="debug-value">
            {env.shadowX.toFixed(1)}px&nbsp;/&nbsp;{env.shadowY.toFixed(1)}px
          </span>
        </div>
        <div className="debug-row">
          <span className="debug-label">Blur</span>
          <span className="debug-value">{env.shadowBlur.toFixed(1)}px</span>
        </div>
        <div className="debug-row">
          <span className="debug-label">Opacity</span>
          <span className="debug-value">{env.shadowOpacity.toFixed(2)}</span>
        </div>
        <div className="debug-row">
          <span className="debug-label">Surface warmth</span>
          <span className="debug-value">{env.surfaceWarmth.toFixed(2)}</span>
        </div>
        <div className="debug-row">
          <span className="debug-label">Ambient contrast</span>
          <span className="debug-value">{env.ambientContrast.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  meta: string;
  open: boolean;
  onClick: () => void;
}

function CollapsibleToggle({ label, meta, open, onClick }: ToggleProps) {
  return (
    <button
      type="button"
      className={`advanced-toggle ${open ? "open" : ""}`}
      onClick={onClick}
      aria-expanded={open}
    >
      <span className="advanced-toggle-label">{label}</span>
      <span className="advanced-toggle-meta">{meta}</span>
      <svg
        className="advanced-toggle-arrow"
        viewBox="0 0 12 12"
        width="10"
        height="10"
        aria-hidden
      >
        <path
          d="M2 4.5 L6 8 L10 4.5"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  resetValue?: number;
  trailing?: React.ReactNode;
  onInteract?: () => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  resetValue,
  trailing,
  onInteract,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const showReset =
    resetValue !== undefined && Math.abs(value - resetValue) > 0.001;
  return (
    <label className="slider">
      <div className="slider-head">
        <span className="slider-label">{label}</span>
        <span className="slider-value-group">
          {trailing}
          {showReset && (
            <button
              type="button"
              className="slider-reset"
              onClick={(e) => {
                e.preventDefault();
                onChange(resetValue!);
              }}
              aria-label={`Reset ${label}`}
              title={`Reset to ${format(resetValue!)}`}
            >
              <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden>
                <path
                  d="M3 6 A3 3 0 1 0 4.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M3 2.5 L3 4.5 L5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <span className="slider-value">{format(value)}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerDown={onInteract}
        style={{ ["--slider-pct" as any]: `${pct}%` }}
      />
    </label>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}

function Switch({ checked, onChange, ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`switch ${checked ? "switch--on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-thumb" aria-hidden />
    </button>
  );
}

interface SegmentedToggleProps<T extends string> {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

function SegmentedToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div className="segmented-field">
      {label && <span className="segmented-label">{label}</span>}
      <div className="segmented" role="radiogroup">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            className={`segmented-option ${
              value === opt.value ? "active" : ""
            }`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
