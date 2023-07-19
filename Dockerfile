# Build

FROM node:18-alpine AS base

WORKDIR /app

COPY . /app/

RUN npm ci
RUN npm run build

RUN npm i -g pkg
RUN pkg dist/index.js -o stream-crawler

# Production

FROM alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache ffmpeg
RUN apk add --no-cache yt-dlp

COPY --from=base /app/stream-crawler /app/

CMD ["./stream-crawler"]
