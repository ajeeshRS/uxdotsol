import { describe, expect, it } from "vitest";

import { createContentSecurityPolicy } from "@/lib/security/csp";

describe("Content Security Policy", () => {
  it("ships restrictive production defaults", () => {
    const policy = createContentSecurityPolicy("production");

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("connect-src 'self' https: wss:");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toMatch(/[\r\n]/);
  });

  it("allows the Next.js development evaluator only in development", () => {
    const policy = createContentSecurityPolicy("development");

    expect(policy).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });
});
