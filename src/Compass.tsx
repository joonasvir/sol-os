import { useCallback, useRef } from "react";

interface Props {
  heading: number; // 0..360 degrees, 0 = arrow up
  onChange: (heading: number) => void;
}

// Minimal compass dial, fixed bottom-left of the page. Drag the needle to
// rotate the phone's orientation — shadows follow accordingly.
//
// Convention: heading 0 means "default orientation" (no rotation applied).
// Increasing heading = phone rotated clockwise; the world (sun) rotates
// counter-clockwise from the phone's frame, so shadows on the screen
// rotate CCW too. We don't label cardinals (N/E/S/W) because the default
// orientation isn't tied to a literal compass bearing — the dial just
// shows the current rotation amount.
export function Compass({ heading, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      // atan2(dx, -dy): 0 = up, +π/2 = right (clockwise positive).
      const radians = Math.atan2(dx, -dy);
      let degrees = (radians * 180) / Math.PI;
      degrees = ((degrees % 360) + 360) % 360;
      onChange(degrees);
    },
    [onChange]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  return (
    <div
      ref={ref}
      className="compass"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      role="slider"
      aria-label="Phone heading"
      aria-valuenow={Math.round(heading)}
      aria-valuemin={0}
      aria-valuemax={360}
    >
      <div className="compass-ring" aria-hidden>
        <span className="compass-tick compass-tick--top" />
        <span className="compass-tick compass-tick--right" />
        <span className="compass-tick compass-tick--bottom" />
        <span className="compass-tick compass-tick--left" />
      </div>
      <div
        className="compass-needle"
        style={{ transform: `rotate(${heading}deg)` }}
        aria-hidden
      >
        <span className="compass-needle-arrow" />
        <span className="compass-needle-tail" />
      </div>
      <div className="compass-center" aria-hidden />
      <div className="compass-readout" aria-hidden>
        {Math.round(heading)}°
      </div>
    </div>
  );
}
