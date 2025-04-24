FROM node:23-alpine AS base
LABEL authors="aquashdw"

WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base AS builder

WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
RUN npm run build

CMD ["ls", "-alF"]

FROM base AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
#COPY --from=builder /app/.env ./
COPY --from=builder /app/vite.config.ts ./

EXPOSE 3000

CMD ["npm", "run", "start"]

