import { useMemo } from "react";

interface Props {
  tiltX: number;
  tiltY: number;
  hour: number;
}

// Format the slider hour value as "8:30" style.
function formatHour(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60) % 60;
  const dispH = ((h + 11) % 12) + 1;
  const ampm = h < 12 || h === 24 ? "AM" : "PM";
  return { time: `${dispH}:${m.toString().padStart(2, "0")}`, ampm };
}

export function Phone({ tiltX, tiltY, hour }: Props) {
  const { time } = formatHour(hour);

  // Analog clock — rotate the hands to match the slider hour.
  const minute = (hour - Math.floor(hour)) * 60;
  const minuteAngle = (minute / 60) * 360;
  const hourAngle = ((hour % 12) / 12) * 360;

  const phoneStyle = {
    transform: `perspective(2200px) rotateY(${tiltX * 0.85}deg) rotateX(${(-tiltY) * 0.85}deg)`,
  };

  // Memoize the icon set so we don't re-render markup unnecessarily.
  const icons = useMemo(() => buildIcons(), []);

  return (
    <div className="phone-wrap">
      <div className="phone" style={phoneStyle}>
        <div className="phone-frame">
          <div className="phone-bezel-shadow" aria-hidden />
          <div className="phone-side phone-side--left" aria-hidden />
          <div className="phone-side phone-side--right" aria-hidden />
          <div className="screen">
            <div className="screen-wallpaper" aria-hidden />
            <div className="screen-glare" aria-hidden />

            <div className="status-bar">
              <span className="status-time">{time}</span>
              <div className="dynamic-island" aria-hidden />
              <span className="status-icons">
                <Signal />
                <Wifi />
                <Battery />
              </span>
            </div>

            <div className="home">
              <div className="widgets">
                <div className="widget widget--weather elevated lg">
                  <div className="widget-top">
                    <div className="weather-glyph">
                      <span className="weather-sun" />
                    </div>
                    <span className="weather-label">CLEAR</span>
                  </div>
                  <div className="widget-temp">18°</div>
                  <div className="widget-meta">H:24°  L:14°</div>
                </div>

                <div className="widget widget--clock elevated lg">
                  <div className="clock-face">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <span
                        key={i}
                        className={`tick ${i % 3 === 0 ? "tick-major" : ""}`}
                        style={{ transform: `rotate(${i * 30}deg)` }}
                      />
                    ))}
                    <span
                      className="hand hand--hour"
                      style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }}
                    />
                    <span
                      className="hand hand--minute"
                      style={{ transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }}
                    />
                    <span className="clock-pivot" />
                  </div>
                </div>
              </div>

              <div className="grid">
                {icons.map((icon, i) => (
                  <div key={i} className={`tile elevated sm tile--${icon.tone}`}>
                    {icon.glyph}
                  </div>
                ))}
              </div>

              <div className="page-dots">
                <span className="dot dot--active" />
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>

              <div className="dock elevated md">
                <div className="dock-tile elevated sm tile--cream">
                  <PhoneGlyph />
                </div>
                <div className="dock-tile elevated sm tile--blue">
                  <BubbleGlyph />
                </div>
                <div className="dock-tile elevated sm tile--cream">
                  <MailGlyph />
                </div>
                <div className="dock-tile elevated sm tile--mist">
                  <CompassGlyph />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="phone-floor-shadow" aria-hidden />
      </div>
    </div>
  );
}

// ── Icon data ──────────────────────────────────────────────────────────────

interface IconDef {
  tone: "cream" | "mist" | "sage" | "sand" | "blue" | "stone";
  glyph: React.ReactNode;
}

function buildIcons(): IconDef[] {
  return [
    { tone: "sand",  glyph: <Glyph><circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.85" /></Glyph> },
    { tone: "mist",  glyph: <Glyph><path d="M4 17 L10 11 L14 14 L20 8 L20 17 Z" fill="currentColor" opacity="0.7" /></Glyph> },
    { tone: "cream", glyph: <Glyph><rect x="5" y="7" width="14" height="2" rx="1" fill="currentColor" opacity="0.55" /><rect x="5" y="11" width="10" height="2" rx="1" fill="currentColor" opacity="0.55" /><rect x="5" y="15" width="12" height="2" rx="1" fill="currentColor" opacity="0.55" /></Glyph> },
    { tone: "sage",  glyph: <Glyph><path d="M12 4 C 8 7 6 12 7 18 C 13 17 17 13 17 7 Z" fill="currentColor" opacity="0.75" /></Glyph> },
    { tone: "cream", glyph: <Glyph><g opacity="0.6"><circle cx="7"  cy="7" r="1.4" fill="currentColor" /><circle cx="12" cy="7" r="1.4" fill="currentColor" /><circle cx="17" cy="7" r="1.4" fill="currentColor" /><circle cx="7"  cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="17" cy="12" r="1.4" fill="currentColor" /><circle cx="7"  cy="17" r="1.4" fill="currentColor" /><circle cx="12" cy="17" r="1.4" fill="currentColor" /><circle cx="17" cy="17" r="1.4" fill="currentColor" /></g></Glyph> },
    { tone: "stone", glyph: <Glyph><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.55"/><circle cx="12" cy="12" r="2.4" fill="currentColor" opacity="0.7" /></Glyph> },
    { tone: "mist",  glyph: <Glyph><path d="M5 6 L19 6 L17 18 L7 18 Z" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.6" /><path d="M9 9 L15 9" stroke="currentColor" strokeWidth="1.4" opacity="0.6" strokeLinecap="round" /></Glyph> },
    { tone: "sand",  glyph: <Glyph><circle cx="9" cy="12" r="5" fill="currentColor" opacity="0.55" /><circle cx="15" cy="12" r="5" fill="currentColor" opacity="0.7" /></Glyph> },
    { tone: "stone", glyph: <Glyph><path d="M8 6 L16 6 L13 13 L8 18 Z" fill="currentColor" opacity="0.55" /><path d="M16 6 L13 13" stroke="currentColor" strokeWidth="1" opacity="0.4" /></Glyph> },
    { tone: "sage",  glyph: <Glyph><path d="M9 6 L17 12 L9 18 Z" fill="currentColor" opacity="0.75" /></Glyph> },
    { tone: "cream", glyph: <Glyph><rect x="5" y="7" width="13" height="2" rx="1" fill="currentColor" opacity="0.55" /><rect x="5" y="11" width="9" height="2" rx="1" fill="currentColor" opacity="0.55" /><rect x="5" y="15" width="11" height="2" rx="1" fill="currentColor" opacity="0.55" /><circle cx="18.5" cy="16" r="1.6" fill="currentColor" opacity="0.7" /></Glyph> },
    { tone: "cream", glyph: <Glyph><circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.7" /></Glyph> },
  ];
}

// ── Tiny SVG primitives ────────────────────────────────────────────────────

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" className="glyph">
      {children}
    </svg>
  );
}

function PhoneGlyph() {
  return (
    <Glyph>
      <path
        d="M7 4 C 6 4 5 5 6 7 L 8 11 C 9 13 11 15 13 16 L 17 18 C 19 19 20 18 20 17 L 19.5 14.5 C 19.3 13.7 18.7 13.4 18 13.6 L 16 14 C 14.6 13.2 12.8 11.4 12 10 L 12.4 8 C 12.6 7.3 12.3 6.7 11.5 6.5 L 9 6 Z"
        fill="currentColor"
        opacity="0.78"
      />
    </Glyph>
  );
}

function BubbleGlyph() {
  return (
    <Glyph>
      <path
        d="M5 11 C 5 7 8.5 5 12 5 C 15.5 5 19 7 19 11 C 19 15 15.5 17 12 17 C 11 17 10 16.85 9 16.55 L 6 18 L 6.7 15 C 5.7 13.9 5 12.5 5 11 Z"
        fill="currentColor"
        opacity="0.78"
      />
    </Glyph>
  );
}

function MailGlyph() {
  return (
    <Glyph>
      <rect x="4" y="7" width="16" height="11" rx="1.6" fill="currentColor" opacity="0.7" />
      <path d="M4 8 L12 14 L20 8" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.85" />
    </Glyph>
  );
}

function CompassGlyph() {
  return (
    <Glyph>
      <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.18" />
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <path d="M12 5 L14 12 L12 19 L10 12 Z" fill="currentColor" opacity="0.85" />
    </Glyph>
  );
}

function Signal() {
  return (
    <svg viewBox="0 0 18 12" width="14" height="10" aria-hidden>
      <rect x="0"  y="8" width="3" height="4" rx="0.6" fill="currentColor" />
      <rect x="5"  y="5" width="3" height="7" rx="0.6" fill="currentColor" />
      <rect x="10" y="2" width="3" height="10" rx="0.6" fill="currentColor" />
      <rect x="15" y="0" width="3" height="12" rx="0.6" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

function Wifi() {
  return (
    <svg viewBox="0 0 14 10" width="14" height="10" aria-hidden>
      <path d="M1 4 C 4 1 10 1 13 4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M3 6 C 5 4 9 4 11 6" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <circle cx="7" cy="8.5" r="1" fill="currentColor" />
    </svg>
  );
}

function Battery() {
  return (
    <svg viewBox="0 0 22 10" width="22" height="10" aria-hidden>
      <rect x="0.5" y="0.5" width="19" height="9" rx="2" fill="none" stroke="currentColor" strokeOpacity="0.55" />
      <rect x="2"   y="2"   width="14" height="6" rx="1" fill="currentColor" />
      <rect x="20"  y="3"   width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
