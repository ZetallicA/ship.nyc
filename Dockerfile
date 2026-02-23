FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY backend/package.json ./

# Frontend build goes into public/ — backend will serve it
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 8000

CMD sh -c "\
  until npx prisma migrate deploy 2>&1; do \
    echo 'Migration failed, retrying in 5s...' && sleep 5; \
  done && \
  node dist/index.js"
