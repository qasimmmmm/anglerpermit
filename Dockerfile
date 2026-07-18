# AnglerPermit — multi-stage build using Next.js standalone output
# syntax=docker/dockerfile:1

# ---- deps: install node_modules ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- build: compile the Next.js app ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal production image with standalone output ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Env vars at runtime (all optional — the app works with zero env vars):
#   RESEND_API_KEY   Resend API key for admin notification emails
#   ADMIN_EMAIL      inbox that receives new application notifications
#   EMAIL_FROM       sender identity (default: AnglerPermit <applications@anglerpermit.com>)
#   NEXT_PUBLIC_SITE_URL  canonical site URL for metadata/sitemap
CMD ["node", "server.js"]
