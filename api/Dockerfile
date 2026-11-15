# Express. Build context = folder api/. DB = MySQL lewat DATABASE_URL. Tidak menyimpan file.
FROM node:24-alpine AS build
WORKDIR /app
# python3/make/g++ buat native module (kalau ada)
RUN apk add --no-cache python3 make g++ openssl
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build --if-present && npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache openssl && addgroup -S -g 1001 app && adduser -S -u 1001 -G app app
ENV NODE_ENV=production PORT=4000
COPY --from=build --chown=app:app /app ./
USER app
EXPOSE 4000
CMD ["npm", "start"]
