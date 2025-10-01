FROM oven/bun:latest AS builder
WORKDIR /app
COPY package.json bun.lock ./
COPY processor/package.json ./processor/
COPY shared/package.json ./shared/
RUN bun install --production
COPY shared/ ./shared/
COPY processor/src ./processor/src

FROM oven/bun:latest AS production
RUN apt-get update && apt-get install -y --no-install-recommends xz-utils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder --chown=bun:bun /app .
WORKDIR /app/processor
USER bun
CMD ["bun", "run", "src"]

