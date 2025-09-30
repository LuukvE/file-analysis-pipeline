FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY processor/package.json ./processor
COPY shared .
WORKDIR /app/processor
RUN bun install --production
COPY ./processor/src ./src

FROM oven/bun:1-alpine AS production
RUN apk add --no-cache xz
WORKDIR /app/processor
COPY --from=builder --chown=bun:bun /app/processor/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/processor/src ./src
COPY --from=builder --chown=bun:bun /app/processor/package.json ./
USER bun
CMD ["bun", "run", "src"]

