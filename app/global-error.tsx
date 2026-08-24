"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("UX.SOL client error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Something went wrong | UX.SOL</title>
      </head>
      <body
        style={{
          margin: 0,
          background: "#000",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main
          style={{
            boxSizing: "border-box",
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            maxWidth: 760,
            margin: "0 auto",
            padding: 32,
          }}
        >
          <p style={{ color: "#a3a3a3", fontWeight: 600 }}>UX.SOL</p>
          <h1 style={{ margin: "12px 0", fontSize: "clamp(2rem, 8vw, 4rem)" }}>
            Something went wrong.
          </h1>
          <p style={{ color: "#b3b3b3", lineHeight: 1.7 }}>
            The error was recorded. Retry the page, or return home if the
            problem continues.
          </p>
          {error.digest ? (
            <p style={{ color: "#737373", fontSize: 13 }}>
              Error reference: {error.digest}
            </p>
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
            <button
              type="button"
              onClick={unstable_retry}
              style={{
                minHeight: 44,
                border: 0,
                borderRadius: 12,
                background: "#fff",
                color: "#000",
                padding: "0 20px",
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                minHeight: 42,
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #404040",
                borderRadius: 12,
                color: "#fff",
                padding: "0 20px",
                fontWeight: 650,
                textDecoration: "none",
              }}
            >
              Return home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
