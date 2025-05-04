// eslint-disable-next-line camelcase
import child_process, { SpawnOptions } from 'child_process'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { LOGGER_DATE_PATTERN, LOGGER_DIR } from './constants/logger.constant'
import { configManager } from './modules/ConfigManager'

function getFileName() {
  return `${process.env.NODE_ENV || 'dev'}.downloader.%DATE%`
}

const logger = winston.createLogger({
  transports: [
    new DailyRotateFile({
      level: 'debug',
      datePattern: LOGGER_DATE_PATTERN,
      dirname: LOGGER_DIR,
      filename: `${getFileName()}.log`,
    }),
  ],
})

export class Downloader {
  public static downloadUrl(
    url: string,
    options?: {
      output?: string
      formatSort?: string
    },
  ) {
    let cmd = 'yt-dlp'
    const args: string[] = []

    if (process.env.TWITCASTING_DOWNLOADER === 'streamlink') {
      cmd = 'streamlink'

      args.push('--loglevel', 'debug')
      args.push('--output', options?.output || './{author}/{time:%Y%m%d%H%M%S}-{id}.mp4')

      const opts: string[] = Array.from(configManager.config?.streamlinkOptions || [])
      if (opts.length) {
        args.push(...opts)
      }

      args.push(url)
      args.push('best')
    } else {
      const opts = configManager.config?.ytdlOptions
        || configManager.config?.ytdlpOptions
        || []
      if (opts.length) {
        args.push(...opts)
      }

      if (options?.output && !['--output', '-o'].some((v) => opts.includes(v))) {
        args.push('--output', options.output)
      }

      if (options?.formatSort) {
        args.push('--format-sort', options.formatSort)
      }

      args.push(url)
    }

    logger.verbose(JSON.stringify({ cmd, args }))
    logger.verbose(`${cmd} ${args.join(' ')}`)

    const spawnOptions: SpawnOptions = {
      cwd: process.cwd(),
      // detached: true,
      // stdio: 'inherit',
    }

    const cp = process.platform === 'win32'
      ? child_process.spawn(process.env.comspec, ['/c', cmd, ...args], spawnOptions)
      : child_process.spawn(cmd, args, spawnOptions)

    if (cp.stdout) {
      cp.stdout.setEncoding('utf8')
      cp.stdout.on('data', (data) => {
        const msg = data.toString().trim()
        if (msg) {
          logger.debug(msg)
        }
      })
    }

    if (cp.stderr) {
      cp.stderr.setEncoding('utf8')
      cp.stderr.on('data', (data) => {
        const msg = data.toString().trim()
        if (msg) {
          logger.debug(msg)
        }
      })
    }

    cp.unref()
  }
}
