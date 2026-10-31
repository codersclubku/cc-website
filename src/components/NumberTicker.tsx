import React, { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  direction = "up",
  delay = 0,
  decimalPlaces = 0,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const prefersReduced = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<string>(
    `${prefix}${(direction === "down" ? value : 0).toFixed(decimalPlaces)}${suffix}`
  );

  useEffect(() => {
    if (prefersReduced) return;

    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isInView, delay, value, direction, motionValue, prefersReduced]);

  useEffect(() => {
    if (prefersReduced) return;
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(`${prefix}${Number(latest).toFixed(decimalPlaces)}${suffix}`);
    });
    return () => unsubscribe();
  }, [springValue, decimalPlaces, prefix, suffix, prefersReduced]);

  if (prefersReduced) {
    return (
      <span
        ref={ref}
        className={`inline-block tabular-nums tracking-tight ${className}`.trim()}
      >
        {`${prefix}${value.toFixed(decimalPlaces)}${suffix}`}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className={`inline-block tabular-nums tracking-tight ${className}`.trim()}
    >
      {displayValue}
    </span>
  );
};
