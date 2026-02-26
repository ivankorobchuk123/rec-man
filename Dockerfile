# Stage 1: build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine

# envsubst for PORT substitution (Railway, Heroku, etc.)
RUN apk add --no-cache gettext

COPY --from=builder /app/dist /usr/share/nginx/html

# Template: PORT is substituted at runtime from process.env.PORT
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Use PORT from Railway or default to 80 for local runs
ENV PORT=80

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
