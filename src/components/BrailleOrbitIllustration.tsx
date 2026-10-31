import React, { useRef, useEffect } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

const BRAILLE_CHARS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏", "⠛", "⠝"];

export const BrailleOrbitIllustration: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isVisible = true;
    let animationFrameId: number;
    let angle1 = 0;
    let angle2 = Math.PI / 3;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    const computed = getComputedStyle(canvas);
    const accentColor = computed.getPropertyValue("--accent").trim() || "#7B2CBF";
    const textColor = computed.getPropertyValue("--text-muted").trim() || "#6B5A82";

    const width = 140;
    const height = 140;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const count1 = 8;
      const rx1 = 48;
      const ry1 = 20;
      for (let i = 0; i < count1; i++) {
        const theta = angle1 + (i * 2 * Math.PI) / count1;
        const x = cx + rx1 * Math.cos(theta);
        const y = cy + ry1 * Math.sin(theta);
        const depth = (Math.sin(theta) + 1) / 2;
        ctx.fillStyle = depth > 0.5 ? accentColor : textColor;
        ctx.globalAlpha = 0.35 + depth * 0.65;
        const char = BRAILLE_CHARS[i % BRAILLE_CHARS.length];
        ctx.fillText(char, x, y);
      }

      const count2 = 6;
      const rx2 = 24;
      const ry2 = 44;
      for (let i = 0; i < count2; i++) {
        const theta = -angle2 + (i * 2 * Math.PI) / count2;
        const x = cx + rx2 * Math.cos(theta);
        const y = cy + ry2 * Math.sin(theta);
        const depth = (Math.sin(theta) + 1) / 2;
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.25 + depth * 0.75;
        const char = BRAILLE_CHARS[(i + 3) % BRAILLE_CHARS.length];
        ctx.fillText(char, x, y);
      }

      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 1;
      ctx.fillRect(cx - 3, cy - 3, 6, 6);

      if (!prefersReduced && isVisible) {
        angle1 += 0.02;
        angle2 += 0.025;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReduced]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 140, height: 140 }}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
};
