# Stage 1: Build the Angular application
FROM node:20-alpine as build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:alpine
COPY --from=build /usr/src/app/www /usr/share/nginx/html
EXPOSE 80
