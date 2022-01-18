// eslint-disable-next-line camelcase
import child_process, { SpawnOptions } from 'child_process'
import { logger as baseLogger } from './logger'

const logger = baseLogger.child({ label: '[Downloader]' })

export class Downloader {
  public static downloadUrl(url: string, options?: { output?: string }) {
    const cmd = 'yt-dlp'
    const args = []
    if (options?.output) {
      args.push('-o', options.output)
    }
    args.push(url)
    logger.verbose(`${cmd} ${args.join(' ')}`)

    const spawnOptions: SpawnOptions = {
      stdio: 'ignore',
      // detached: true,
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cp = process.platform === 'win32'
      ? child_process.spawn(process.env.comspec, ['/c', cmd, ...args], spawnOptions)
      : child_process.spawn(cmd, args, spawnOptions)
    // cp.unref()
  }
}
