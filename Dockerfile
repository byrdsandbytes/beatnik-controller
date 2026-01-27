# Stage 1: Build the Angular application
FROM node:20-alpine as build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve the application from a lightweight Caddy server
FROM caddy:alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /usr/src/app/www /usr/share/caddy
EXPOSE 80
EXPOSE 443
