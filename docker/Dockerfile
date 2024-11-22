# BASE
FROM node:lts-alpine AS base

RUN apk add --no-cache tini

WORKDIR /app

COPY package*.json ./

# DEPENDENCIES
FROM base AS dependencies

RUN npm ci --omit=dev

# BUILDER
FROM base AS builder

RUN npm ci

COPY . .

RUN npm run build

# RELEASE
FROM base AS release

ENV NODE_ENV=production

VOLUME /app/logs
VOLUME /app/download

RUN apk add --no-cache curl
RUN apk add --no-cache ffmpeg
RUN apk add --no-cache python3 py3-pip py3-websockets

# Install latest yt-dlp
RUN curl -L -o /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder      /app/dist ./dist

ENTRYPOINT [ "/sbin/tini", "--", "node", "dist/index" ]
