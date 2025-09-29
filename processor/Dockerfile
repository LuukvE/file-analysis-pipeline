FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN bun install --production
COPY ./src ./src

FROM oven/bun:1-alpine AS production
RUN apk add --no-cache xz
WORKDIR /app
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/src ./src
COPY --from=builder --chown=bun:bun /app/package.json ./
USER bun
CMD ["bun", "run", "src"]

