FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg
RUN apk add --no-cache yt-dlp

COPY . /app/

RUN npm install
RUN npm run build

ENV NODE_ENV=production

CMD ["node", "/app/dist/index.js"]
