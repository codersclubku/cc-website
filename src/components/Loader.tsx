import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export interface LoaderProps {
  variant?: "snake" | "spinner" | "card";
  size?: "sm" | "md" | "lg";
  title?: string;
  helperText?: string;
  className?: string;
  delayMs?: number;
}

const snakeOrder = [0, 1, 2, 5, 8, 7, 6, 3];

export const Loader: React.FC<LoaderProps> = ({
  variant = "snake",
  size = "md",
  title = "Loading...",
  helperText = "Please wait a moment",
  className = "",
  delayMs = 200,
}) => {
  const [visible, setVisible] = useState(delayMs === 0);
  const [activePixel, setActivePixel] = useState(0);

  useEffect(() => {
    if (delayMs === 0) return;
    const timer = setTimeout(() => {
      setVisible(true);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (variant !== "snake" || !visible) return;
    const interval = setInterval(() => {
      setActivePixel((prev) => (prev + 1) % snakeOrder.length);
    }, 110);
    return () => clearInterval(interval);
  }, [variant, visible]);

  if (!visible) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        <span>{title}</span>
      </div>
    );
  }

  const spinnerSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  if (variant === "spinner") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center justify-center text-[var(--accent)] ${className}`}
      >
        <Loader2 className={`${spinnerSizes[size]} animate-spin`} />
        <span className="sr-only">{title}</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`p-8 border border-[var(--border)] rounded-sm bg-[var(--surface)] flex flex-col items-center justify-center text-center gap-4 ${className}`}
      >
        <Loader variant="snake" size={size} delayMs={0} />
        <div>
          <h4 className="text-base font-semibold text-[var(--text-strong)] m-0">{title}</h4>
          {helperText && (
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-0">{helperText}</p>
          )}
        </div>
        <span className="sr-only">{title}</span>
      </div>
    );
  }

  const activeIdx = snakeOrder[activePixel];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="grid grid-cols-3 gap-1.5 p-1.5" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => {
          const isCenter = i === 4;
          const isActive = i === activeIdx;
          const isPrev = i === snakeOrder[(activePixel - 1 + snakeOrder.length) % snakeOrder.length];

          return (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-[1px] transition-all duration-150 ${
                isCenter
                  ? "bg-[var(--border)]/40"
                  : isActive
                  ? "bg-[var(--accent)] scale-110 shadow-[0_0_8px_var(--accent)]"
                  : isPrev
                  ? "bg-[var(--accent)]/60"
                  : "bg-[var(--border)]"
              }`}
            />
          );
        })}
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
};
