import axios from 'axios'
import path from 'path'
import winston from 'winston'
import { configManager } from '../ConfigManager'
import { APP_DOWNLOAD_DIR } from '../constants/app.constant'
import { Downloader } from '../Downloader'
import { logger as baseLogger } from '../logger'

class TwitCastingCrawler {
  private logger: winston.Logger
  private config: Record<string, any>
  private interval: number
  private users: any[]
  private liveIds: Set<string> = new Set()

  constructor() {
    this.logger = baseLogger.child({ label: '[TwitCastingCrawler]' })
    this.config = configManager.config?.twitcasting || {}
    this.interval = this.config.interval || 30000
    this.users = (this.config.users || []).filter((v) => v.id)
  }

  public async start() {
    this.logger.info('start')
    this.users.forEach((user) => {
      this.logger.info(`[${user.id}] Watching`, user)
      this.handleUser(user)
    })
  }

  private async handleUser(user: any) {
    this.logger.debug('handleUser', { user })
    try {
      const data = await this.getUser(user.id)
      const { movie } = data
      const streamUrl = this.getStreamUrl(user.id, movie.id)
      if (movie.live && !this.liveIds.has(movie.id)) {
        this.logger.info(`[${user.id}] Found new live stream @ ${streamUrl}`)
        const dir = path.join(__dirname, APP_DOWNLOAD_DIR)
        const output = path.join(dir, '%(id)s.%(ext)s')
        Downloader.downloadUrl(streamUrl, { output })
        this.liveIds.add(movie.id)
      } else if (!movie.live && this.liveIds.has(movie.id)) {
        this.logger.info(`[${user.id}] Live stream ended`)
        this.liveIds.delete(movie.id)
      }
    } catch (error) {
      this.logger.error(`handleUser: ${error.message}`)
    }
    setTimeout(() => this.handleUser(user), this.interval)
  }

  private async getUser(id: string) {
    const url = `https://twitcasting.tv/streamserver.php?target=${id}&mode=client`
    this.logger.debug('getUser', { id, url })
    const { data } = await axios.get(url)
    return data
  }

  // eslint-disable-next-line class-methods-use-this
  private getStreamUrl(userId: string, movieId: string) {
    const url = `https://twitcasting.tv/${userId}/movie/${movieId}`
    return url
  }
}

export const twitCastingCrawler = new TwitCastingCrawler()
