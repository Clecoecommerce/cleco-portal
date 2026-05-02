"use client";
import { useEffect, useRef, useState } from "react";

export function useCounter(end: number, duration = 2000) {
  const [count, setCount]   = useState(0);
  const [active, setActive] = useState(false);
  const rafRef = useRef<number>();

  function trigger() { setActive(true); }

  useEffect(() => {
    if (!active) return;
    const startTime = performance.now();
    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(end * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, end, duration]);

  return { count, trigger };
}
