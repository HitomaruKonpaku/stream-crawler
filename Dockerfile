# Build

FROM node:18-alpine AS base

WORKDIR /app

RUN apk add --no-cache ffmpeg
RUN apk add --no-cache yt-dlp

COPY . /app/

RUN npm install
RUN npm run build

# Production

FROM node:18-alpine

ENV NODE_ENV=production

COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json .
COPY --from=base /app/package-lock.json .

RUN npm ci

CMD ["node", "/app/dist/index.js"]
