# BASE
FROM node:lts-alpine AS base

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

RUN apk add --no-cache tini bash
RUN apk add --no-cache curl
RUN apk add --no-cache ffmpeg
RUN apk add --no-cache python3 py3-pip py3-websockets
RUN apk add --no-cache streamlink

# Install latest yt-dlp
RUN curl -L -o /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp
RUN yt-dlp --update-to master

RUN streamlink --version
RUN yt-dlp --version

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder      /app/dist ./dist

ENV NODE_ENV=production

VOLUME /app/logs
VOLUME /app/download

ENTRYPOINT [ "/sbin/tini", "--", "node", "dist/index" ]
