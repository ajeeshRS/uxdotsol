const STATIC_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
] as const;

export function createContentSecurityPolicy(
  environment: "development" | "production" | "test" =
    process.env.NODE_ENV,
) {
  const directives: string[] = [...STATIC_DIRECTIVES];

  if (environment === "development") {
    directives[1] += " 'unsafe-eval'";
  }

  if (environment === "production") {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
