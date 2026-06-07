FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG PUBLIC_POCKETBASE_URL=https://pocketbase-finanzen.dasdann.jetzt
ENV PUBLIC_POCKETBASE_URL=${PUBLIC_POCKETBASE_URL}

RUN npm run build
RUN npm prune --production

FROM node:24-alpine

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

# Security: Run as non-root user
RUN chown -R node:node /app
USER node

ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "build/index.js"]
