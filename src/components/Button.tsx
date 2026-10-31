import React, { forwardRef, useRef, useLayoutEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  shimmer?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      shimmer = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLButtonElement | null>(null);
    const [fixedWidth, setFixedWidth] = useState<number | undefined>(undefined);

    useLayoutEffect(() => {
      if (internalRef.current && !loading && internalRef.current.offsetWidth > 0) {
        setFixedWidth(internalRef.current.offsetWidth);
      }
    }, [children, loading]);

    const setRefs = (node: HTMLButtonElement | null) => {
      internalRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const variantClass = `cc-btn--${variant}`;
    const sizeClass = size === "sm" ? "cc-btn--sm" : size === "lg" ? "cc-btn--lg" : "";
    const shimmerClass = shimmer ? "cc-btn--shimmer" : "";
    const loadingClass = loading ? "cc-btn--loading" : "";

    return (
      <button
        ref={setRefs}
        disabled={disabled || loading}
        aria-busy={loading ? "true" : undefined}
        style={loading && fixedWidth ? { minWidth: `${fixedWidth}px` } : undefined}
        className={`cc-btn ${variantClass} ${sizeClass} ${shimmerClass} ${loadingClass} ${className}`.trim()}
        {...props}
      >
        {loading && (
          <span className="cc-btn__spinner" aria-hidden="true">
            <Loader2 className="w-4 h-4 animate-spin text-current" />
          </span>
        )}
        <span className={loading ? "opacity-0" : undefined}>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
