"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#0f1c33",
          color: "#fff",
          borderRadius: "0.7rem",
          padding: "0.75rem 1rem",
          fontSize: "0.9rem",
          lineHeight: 1.5,
          boxShadow: "0 18px 36px rgb(9 17 33 / 0.35)",
        },
        success: {
          iconTheme: { primary: "#8fd6ae", secondary: "#0f1c33" },
        },
        error: {
          style: { background: "#8f1c13", color: "#fff" },
          iconTheme: { primary: "#ffd7d2", secondary: "#8f1c13" },
        },
      }}
    />
  );
}
