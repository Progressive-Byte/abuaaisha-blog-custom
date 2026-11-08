"use client";

import { useEffect } from "react";

export function PostInteractions() {
  useEffect(() => {
    const prose = document.querySelector<HTMLElement>("[data-prose]");
    const buttons = document.querySelectorAll<HTMLButtonElement>("[data-size]");

    const apply = (size: string) => {
      prose?.setAttribute("data-text-size", size);
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.size === size)));
    };

    try {
      const saved = localStorage.getItem("reading-size");
      if (saved) apply(saved);
    } catch {
      // Ignore storage failures.
    }

    const onSize = (button: HTMLButtonElement) => {
      const size = button.dataset.size ?? "md";
      apply(size);
      try {
        localStorage.setItem("reading-size", size);
      } catch {
        // Ignore storage failures.
      }
    };

    const listeners = [...buttons].map((button) => {
      const handler = () => onSize(button);
      button.addEventListener("click", handler);
      return () => button.removeEventListener("click", handler);
    });

    const copy = document.querySelector<HTMLButtonElement>("[data-copy]");
    const onCopy = async () => {
      const label = copy?.querySelector("span");
      try {
        await navigator.clipboard.writeText(copy?.dataset.copy ?? location.href);
        if (label) label.textContent = "কপি হয়েছে";
      } catch {
        if (label) label.textContent = "কপি করা যায়নি";
      }
      window.setTimeout(() => {
        if (label) label.textContent = "লিংক কপি";
      }, 2000);
    };
    copy?.addEventListener("click", onCopy);

    const print = document.querySelector("[data-print]");
    const onPrint = () => window.print();
    print?.addEventListener("click", onPrint);

    return () => {
      listeners.forEach((off) => off());
      copy?.removeEventListener("click", onCopy);
      print?.removeEventListener("click", onPrint);
    };
  }, []);

  return null;
}
