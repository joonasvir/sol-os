import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

export function About({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="about-overlay" onClick={onClose}>
      <div
        className="about-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="about-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="about-brand">
          <span className="brand-dot" aria-hidden />
          <span className="brand-mark">SolOS</span>
          <span className="brand-sep">/</span>
          <span className="brand-mark soft">TrueShadow</span>
        </div>
        <h1 className="about-title">
          An environmental interface system where digital surfaces are lit by
          the real&nbsp;world.
        </h1>
        <p className="about-tag">Not nature as decoration. Nature as system logic.</p>

        <div className="about-divider" />

        <p className="about-body">
          TrueShadow makes UI elements feel like physical surfaces whose
          shadows are governed by the actual sky. Morning creates longer,
          warmer, lower-angle shadows. Noon creates shorter, tighter shadows.
          Golden hour creates long warm shadows. Overcast conditions create
          flatter, softer, lower-contrast depth. At night, the interface
          becomes quieter and more moonlit.
        </p>
        <p className="about-body">
          This prototype is for tuning the look. The sliders are the product —
          the goal is to find a material that feels like a small physical
          object being lit by the sky.
        </p>
      </div>
    </div>
  );
}
