# BASE
FROM node:lts-alpine AS base

RUN apk add --no-cache tini

WORKDIR /app

COPY package*.json ./

# DEPENDENCIES
FROM base AS dependencies

RUN npm install --no-progress --omit=dev

# BUILDER
FROM base AS builder

RUN npm install

COPY . .

RUN npm run build

# RELEASE
FROM base AS release

ENV NODE_ENV=production

VOLUME /app/logs
VOLUME /app/download

RUN apk add --no-cache ffmpeg yt-dlp

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder      /app/dist ./dist

CMD [ "/sbin/tini", "--", "node", "dist/index" ]
