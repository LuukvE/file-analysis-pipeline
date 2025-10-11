FROM oven/bun:latest
RUN apt-get update && apt-get install -y --no-install-recommends xz-utils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json bun.lock ./
COPY shared ./shared
COPY processor ./processor
COPY server/package.json ./server/
RUN bun install --frozen-lockfile
USER bun
WORKDIR /app/processor
CMD ["bun", "run", "src/index.ts"]

