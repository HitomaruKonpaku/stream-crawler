import axios from 'axios'
import Bottleneck from 'bottleneck'
import EventEmitter from 'events'
import path from 'path'
import winston from 'winston'
import { APP_DOWNLOAD_DIR } from '../constants/app.constant'
import { Downloader } from '../Downloader'
import { logger as baseLogger } from '../logger'
import { Util } from '../utils/Util'
import { configManager } from './ConfigManager'

export class TwitCastingCrawler extends EventEmitter {
  private logger: winston.Logger
  private config: Record<string, any>
  private interval: number
  private users: any[]
  private limiter: Bottleneck
  private liveIds: Set<string> = new Set()

  constructor() {
    super()
    this.logger = baseLogger.child({ label: '[TwitCastingCrawler]' })
    this.config = configManager.config?.twitcasting || {}
    this.interval = this.config.interval || 30000
    this.users = (this.config.users || []).filter((v) => v.id)
    this.limiter = new Bottleneck({ maxConcurrent: 10 })
  }

  public static getStreamUrl(userId: string, movieId: string) {
    const url = `https://twitcasting.tv/${userId}/movie/${movieId}`
    return url
  }

  public async start() {
    this.logger.info('start')
    this.users.forEach(async (user) => {
      await this.initUser(user)
      this.logger.info(`[${user.id}] Monitoring user...`, user)
      await this.handleUser(user)
    })
  }

  private async initUser(user: any) {
    this.logger.debug(`[${user.id}] initUser`)
    try {
      const { user: userData } = await this.limiter.schedule(() => this.getUser(user.id))
      if (userData) {
        Object.assign(user, userData)
      }
    } catch (error) {
      this.logger.error(`[${user.id}] initUser: ${error.message}`)
    }
  }

  private async handleUser(user: any) {
    try {
      const data = await this.limiter.schedule(() => this.getUserStream(user.id))
      const { movie } = data
      if (!movie) {
        this.handleUserWithTimer(user)
        return
      }
      if (movie.live && !this.liveIds.has(movie.id)) {
        const streamUrl = TwitCastingCrawler.getStreamUrl(user.id, movie.id)
        this.logger.info(`[${user.id}] Found new live stream @ ${streamUrl}`)
        const dir = path.join(__dirname, APP_DOWNLOAD_DIR)
        const output = path.join(dir, `[%(uploader_id)s][${Util.getTimeString()}] (%(id)s).%(ext)s`)
        Downloader.downloadUrl(streamUrl, { output })
        this.liveIds.add(movie.id)
        this.emit('live', { user, movie })
      } else if (!movie.live && this.liveIds.has(movie.id)) {
        this.logger.info(`[${user.id}] Live stream ended`)
        this.liveIds.delete(movie.id)
      }
    } catch (error) {
      this.logger.error(`[${user.id}] handleUser: ${error.message}`)
    }
    this.handleUserWithTimer(user)
  }

  private handleUserWithTimer(user: any) {
    setTimeout(() => this.handleUser(user), this.interval)
  }

  private async getUser(id: string) {
    const url = `https://frontendapi.twitcasting.tv/users/${id}?detail=true`
    this.logger.debug(`--> getUser: ${id}`, { id, url })
    const { data } = await axios.get(url)
    this.logger.debug(`<-- getUser: ${id}`)
    return data
  }

  private async getUserStream(id: string) {
    const url = `https://twitcasting.tv/streamserver.php?target=${id}&mode=client`
    this.logger.debug(`--> getUserStream: ${id}`, { id, url })
    const { data } = await axios.get(url)
    this.logger.debug(`<-- getUserStream: ${id}`)
    return data
  }
}

export const twitCastingCrawler = new TwitCastingCrawler()
