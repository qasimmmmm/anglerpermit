/** @type {import('next').NextConfig} */
// Standalone output is ONLY for the Docker/self-hosted build (Dockerfile sets
// DOCKER_BUILD=1). On Vercel, standalone output breaks the deployment, so the
// default config stays standard.

/**
 * Security headers (2026-07-21 hardening audit).
 * Deliberately NO Content-Security-Policy yet: the checkout loads NMI
 * Collect.js from secure.networkmerchants.com and Next injects inline
 * scripts — a strict CSP needs careful allowlisting + testing before launch.
 * HSTS is already sent by Vercel.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" }, // a checkout site has no legit embed use
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
