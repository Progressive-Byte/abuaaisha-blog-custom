"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Lets links use `/counseling/?scroll=sessions` instead of a `#sessions` hash,
 * while still landing on the sessions section. The query param is removed from
 * the address bar after the scroll starts.
 */
export function ScrollToSessions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams?.get("scroll") === "sessions";

  useEffect(() => {
    if (!requested) return;

    const target = document.getElementById("sessions");
    if (target) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    }

    const timer = window.setTimeout(() => router.replace("/counseling/", { scroll: false }), 50);
    return () => window.clearTimeout(timer);
  }, [requested, router]);

  return null;
}
