FROM node:24.18.0-slim AS builder

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --ignore-scripts
COPY backend .
RUN npm run build

FROM node:24.18.0-slim AS dependencies
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:24.18.0-slim AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
ARG PORT=3001
ENV PORT=$PORT

COPY backend/package*.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY backend/start.sh ./start.sh

RUN sed -i 's/\r$//' ./start.sh && chmod +x ./start.sh

EXPOSE $PORT

CMD ["./start.sh"]
