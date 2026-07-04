"use client";

import { useEffect, useState } from "react";
import { ExecutiveBrandMark } from "./ExecutiveBrandMark";

const standardSplashDurationMs = 460;
const reducedMotionSplashDurationMs = 300;

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ExecutiveCardSplash() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const duration = prefersReducedMotion()
      ? reducedMotionSplashDurationMs
      : standardSplashDurationMs;
    const timeoutId = window.setTimeout(() => setIsVisible(false), duration);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="executive-splash" role="status" aria-label="Loading The Executive Card">
      <ExecutiveBrandMark className="executive-splash-mark" />
      <span className="executive-splash-copy">Loading executive identity</span>
    </div>
  );
}
