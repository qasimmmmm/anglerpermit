/** @type {import('next').NextConfig} */
// Standalone output is ONLY for the Docker/self-hosted build (Dockerfile sets
// DOCKER_BUILD=1). On Vercel, standalone output breaks the deployment, so the
// default config stays standard.
const nextConfig = process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {};

export default nextConfig;
