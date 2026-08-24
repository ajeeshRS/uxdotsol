import type { NextConfig } from "next";

import { createContentSecurityPolicy } from "./lib/security/csp";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: createContentSecurityPolicy(),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Link",
            value:
              '</llms.txt>; rel="describedby"; type="text/markdown"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
