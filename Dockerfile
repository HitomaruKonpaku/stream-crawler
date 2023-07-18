FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache yt-dlp

COPY --from=mwader/static-ffmpeg:6.0 /ffmpeg /usr/local/bin/
COPY --from=mwader/static-ffmpeg:6.0 /ffprobe /usr/local/bin/

COPY . /app/

RUN npm install
RUN npm run build

ENV NODE_ENV=production

CMD ["node", "/app/dist/index.js"]
