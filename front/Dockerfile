# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

# Step 1. Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

COPY . ./

RUN npm install

ARG NEXT_PUBLIC_GPT_API_KEY
ARG NEXT_PUBLIC_USER_HOST
ARG NEXT_PUBLIC_MESSAGE_HOST
ARG NEXT_PUBLIC_TEXT_MANAGER_GPT_HOST
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_IP_WHITELIST

ENV NEXT_PUBLIC_GPT_API_KEY=$NEXT_PUBLIC_GPT_API_KEY
ENV NEXT_PUBLIC_USER_HOST=$NEXT_PUBLIC_USER_HOST
ENV NEXT_PUBLIC_MESSAGE_HOST=$NEXT_PUBLIC_MESSAGE_HOST
ENV NEXT_PUBLIC_TEXT_MANAGER_GPT_HOST=$NEXT_PUBLIC_TEXT_MANAGER_GPT_HOST
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENv NEXT_PUBLIC_IP_WHITELIST=$NEXT_PUBLIC_IP_WHITELIST

RUN npm run build

# Step 2. Production image, copy all the files and run next
FROM base AS runner

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Uncomment the following line to disable telemetry at run time
ENV NEXT_TELEMETRY_DISABLED 1

# Note: Don't expose ports here, Compose will handle that for us

CMD ["npm", "start"]