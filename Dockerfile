# Stage 1: build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: serve static files
FROM node:22-alpine

RUN npm install -g serve

COPY --from=builder /app/dist /app/dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "serve -s /app/dist -l ${PORT:-3000}"]
