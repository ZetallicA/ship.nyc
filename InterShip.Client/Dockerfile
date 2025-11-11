FROM node:18-alpine AS build
WORKDIR /app
COPY InterShip.Client/package*.json ./
RUN npm ci --only=production
COPY InterShip.Client/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY InterShip.Client/nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]












