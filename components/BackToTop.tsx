"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import styles from "./BackToTop.module.css";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollY = window.scrollY;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;

      if (ringRef.current) {
        ringRef.current.style.setProperty("stroke-dashoffset", String(100 - progress * 100));
      }

      const showAfter = Math.max(480, window.innerHeight * 0.55);
      const nearBottom = scrollY + window.innerHeight > doc.scrollHeight - 220;
      const next = scrollY > showAfter && !nearBottom;

      if (next !== visibleRef.current) {
        visibleRef.current = next;
        setVisible(next);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function scrollToTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${visible ? styles.visible : ""}`}
      onClick={scrollToTop}
      aria-label="উপরে ফিরে যান"
    >
      <svg className={styles.progress} viewBox="0 0 100 100" aria-hidden="true">
        <circle className={styles.track} cx="50" cy="50" r="47" pathLength="100" />
        <circle ref={ringRef} className={styles.indicator} cx="50" cy="50" r="47" pathLength="100" />
      </svg>
      <span className={styles.icon} aria-hidden="true">
        <Icon name="arrow-up" size={22} />
      </span>
      <span className={styles.label} aria-hidden="true">
        উপরে ফিরে যান
      </span>
    </button>
  );
}
