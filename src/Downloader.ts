// eslint-disable-next-line camelcase
import child_process, { SpawnOptions } from 'child_process'
import { logger as baseLogger } from './logger'
import { configManager } from './modules/ConfigManager'

const logger = baseLogger.child({ label: '[Downloader]' })

export class Downloader {
  public static downloadUrl(
    url: string,
    options?: {
      output?: string
      formatSort?: string
    },
  ) {
    const cmd = 'yt-dlp'
    const args = []
    const ytdlOptions = Array.from(configManager.config?.ytdlOptions || [])
    args.push(...ytdlOptions)
    if (options?.output && !['--output', '-o'].some((v) => ytdlOptions.includes(v))) {
      args.push('--output', options.output)
    }
    if (options?.formatSort) {
      args.push('--format-sort', options.formatSort)
    }
    args.push(url)
    logger.verbose(`${cmd} ${args.join(' ')}`)

    const spawnOptions: SpawnOptions = { detached: true, stdio: 'ignore', cwd: process.cwd() }
    const cp = process.platform === 'win32'
      ? child_process.spawn(process.env.comspec, ['/c', cmd, ...args], spawnOptions)
      : child_process.spawn(cmd, args, spawnOptions)
    cp.unref()
  }
}
