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

### Docker

- See [example](./example/)
- Download [docker-compose.yaml](./example/docker-compose.yaml) and [config.yaml](./example/config.yaml)
- Run

    ```sh
    docker compose up -d
    ```

### Local

1. Make sure you can run `yt-dlp` & `ffmpeg` from current working directory

    ```
    yt-dlp --version
    ```

    ```
    ffmpeg -version
    ```

1. Clone and rename
    - [config.example.yaml](config.example.yaml) to `config.yaml`
    - Or [config.example.json](config.example.json) to `config.json`
1. Start normally or with [pm2](https://pm2.keymetrics.io)

  ```
  npm start
  ```

  ```
  pm2 start ecosystem.config.js
  ```
