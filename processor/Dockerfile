FROM node:22-slim
RUN npm install -g bun
WORKDIR /app
COPY package.json ./
RUN npm install
COPY ./src ./src
CMD ["bun", "src"]
