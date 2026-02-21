# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./
RUN npm install --frozen-lockfile

COPY . .

RUN npm run build

# Stage 2: Run the Next.js application
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/pages ./pages
COPY --from=builder /app/trpc ./trpc

ENV NODE_ENV production
EXPOSE 3000

CMD ["npm", "start"]
