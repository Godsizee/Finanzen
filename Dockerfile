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

ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "build/index.js"]
