FROM oven/bun:latest AS builder
WORKDIR /app
COPY package.json bun.lock ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY processor/package.json ./processor/
RUN bun install --frozen-lockfile
COPY shared/ ./shared/
COPY server/src ./server/src

FROM oven/bun:latest AS production
WORKDIR /app
COPY --from=builder --chown=bun:bun /app .
WORKDIR /app/server
USER bun
CMD ["bun", "--hot", "run", "src"]
