# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1

# Step 1. Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

COPY . ./

RUN npm ci

ARG NEXT_PUBLIC_GPT_ENABLED
ARG NEXT_PUBLIC_USER_HOST
ARG NEXT_PUBLIC_MESSAGE_HOST
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_IP_WHITELIST
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY

ENV NEXT_PUBLIC_GPT_ENABLED=$NEXT_PUBLIC_GPT_ENABLED
ENV NEXT_PUBLIC_USER_HOST=$NEXT_PUBLIC_USER_HOST
ENV NEXT_PUBLIC_MESSAGE_HOST=$NEXT_PUBLIC_MESSAGE_HOST
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_IP_WHITELIST=$NEXT_PUBLIC_IP_WHITELIST
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

RUN npm run build

# Step 2. Production image, copy all the files and run next
FROM base AS runner

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/.next ./.next

# Note: Don't expose ports here, Compose will handle that for us

CMD ["npm", "start"]