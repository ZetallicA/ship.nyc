FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./

EXPOSE 8000

# Wait for postgres, run migrations, then start
CMD sh -c "\
  echo 'Waiting for database...' && \
  until npx prisma migrate deploy 2>&1; do \
    echo 'Migration failed, retrying in 5s...' && sleep 5; \
  done && \
  echo 'Migrations done.' && \
  node dist/index.js"
