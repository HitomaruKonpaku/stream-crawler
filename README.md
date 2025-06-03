# stream-crawler

## Description

> Script to monitor & download TwitCasting, YouTube

## Requirements

- [Node 14 or newer](https://nodejs.org/)
- [ffmpeg](https://www.ffmpeg.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

### Docker

- See [example](./example/)
- Download [docker-compose.yaml](./example/docker-compose.yaml) & [config.yaml](./example/config.yaml)
- Save cookies as file with Netscape format (OPTIONAL)
  - Try [Open Cookies.txt](https://chromewebstore.google.com/detail/open-cookiestxt/gdocmgbfkjnnpapoeobnolbbkoibbcif) on Chrome
- Run

    ```sh
    docker compose up -d
    ```

## Installation

```
npm install
```

```
npm run build
```

## Usage

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

## Update yt-dlp inside docker container

```sh
docker exec -it stream-crawler yt-dlp --update-to master
```
