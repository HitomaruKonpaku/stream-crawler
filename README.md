# stream-crawler

## Description

> Script to monitor & download TwitCasting, YouTube

## Requirements

- [Node 14 or newer](https://nodejs.org/)
- [ffmpeg](https://www.ffmpeg.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

## Installation

```
npm install
```

```
npm run build
```

## Usage

1. Make sure you can run `yt-dlp` & `ffmpeg` from current working directory
1. Clone and rename
    - [config.example.yaml](config.example.yaml) to `config.yaml`
    - Or [config.example.yaml](config.example.yaml) to `config.json`
1. Start normally or with `pm2`

  ```
  npm start
  ```

  ```
  pm2 start ecosystem.config.js
  ```
