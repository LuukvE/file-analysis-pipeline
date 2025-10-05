FROM node:22-noble AS base
WORKDIR /usr/src/app
FROM base AS dependencies
COPY package*.json ./
RUN npm install

FROM base AS build
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /usr/src/app/dist ./dist

CMD ["node", "dist/main"]