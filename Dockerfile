# Stage 1: Build the Angular application
FROM node:20-alpine as build
RUN apk add --no-cache python3 make g++ git
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
# Increase memory limit for Angular build if needed
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Stage 2: Serve the application from a lightweight Caddy server
FROM caddy:alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /usr/src/app/www /usr/share/caddy
EXPOSE 80
EXPOSE 443
