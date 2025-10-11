FROM oven/bun:latest
RUN apt-get update && apt-get install -y --no-install-recommends xz-utils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json bun.lock ./
COPY shared ./shared
COPY server ./server
COPY processor/package.json ./processor/
RUN bun install --frozen-lockfile
USER bun
CMD ["bun", "run", "server/src/index.ts"]

