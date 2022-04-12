import axios from 'axios'
import EventEmitter from 'events'
import path from 'path'
import winston from 'winston'
import { APP_DEFAULT_REFRESH_INTERVAL, APP_DOWNLOAD_DIR } from '../constants/app.constant'
import { Downloader } from '../Downloader'
import { twitCastingLimiter } from '../Limiter'
import { logger as baseLogger } from '../logger'
import { TwitCastingUtil } from '../utils/TwitCastingUtil'
import { Util } from '../utils/Util'
import { configManager } from './ConfigManager'
import { Webhook } from './Webhook'

interface User {
  id: string
  name?: string
  [key: string]: any
}

export class TwitCastingCrawler extends EventEmitter {
  private logger: winston.Logger
  private interval: number
  private users: User[]
  private videoIds = new Set<string>()

  constructor() {
    super()
    this.logger = baseLogger.child({ label: '[TwitCastingCrawler]' })
  }

  public async start() {
    this.logger.info('start')

    const config = configManager.config?.twitcasting || {}
    this.interval = config.interval || APP_DEFAULT_REFRESH_INTERVAL
    this.users = Array.from<any>(config.users || [])
      .filter((v) => typeof v === 'string' || v.id)
      .map((v) => (typeof v !== 'string' ? v : { id: v }))

    this.users.forEach((user) => this.monitorUser(user))
  }

  private async monitorUser(user: User) {
    await this.initUser(user)
    this.logger.info(`monitorUser: ${user.id}`, user)
    await this.checkUser(user)
  }

  private async initUser(user: User) {
    try {
      const { user: data } = await twitCastingLimiter.schedule(() => this.getUser(user.id))
      if (data) {
        Object.assign(user, data)
      }
    } catch (error) {
      this.logger.error(`initUser: ${user.id}: ${error.message}`)
    }
  }

  private async checkUser(user: User) {
    try {
      const data = await twitCastingLimiter.schedule(() => this.getUserStream(user.id))
      const { movie } = data
      if (!movie) {
        this.checkUserWithTimeout(user)
        return
      }
      if (movie.live && !this.videoIds.has(movie.id)) {
        this.videoIds.add(movie.id)
        const movieUrl = TwitCastingUtil.getMovieUrl(user.id, movie.id)
        this.logger.info(`${user.id} live: ${movieUrl}`)
        this.sendWebhooks(user, movie)
        const output = path.join(__dirname, APP_DOWNLOAD_DIR, 'twitcasting', `[%(uploader_id)s][${Util.getTimeString()}] %(title)s (%(id)s).%(ext)s`)
        Downloader.downloadUrl(movieUrl, {
          output,
          // Add formatSort due to yt-dlp error
          // websockets.exceptions.InvalidStatusCode: server rejected WebSocket connection: HTTP 403
          // formatSort: 'proto:m3u8',
        })
      } else if (!movie.live && this.videoIds.has(movie.id)) {
        this.logger.info(`${user.id} live ended`)
        this.videoIds.delete(movie.id)
      }
    } catch (error) {
      this.logger.error(`checkUser: ${user.id}: ${error.message}`)
    }
    this.checkUserWithTimeout(user)
  }

  private checkUserWithTimeout(user: User) {
    setTimeout(() => this.checkUser(user), this.interval)
  }

  private async getUser(id: string) {
    const url = `https://frontendapi.twitcasting.tv/users/${id}?detail=true`
    this.logger.debug(`--> getUser: ${id}`)
    const { data } = await axios.get(url)
    this.logger.debug(`<-- getUser: ${id}`)
    return data
  }

  private async getUserStream(id: string) {
    const url = `https://twitcasting.tv/streamserver.php?target=${id}&mode=client`
    this.logger.debug(`--> getUserStream: ${id}`)
    const { data } = await axios.get(url)
    this.logger.debug(`<-- getUserStream: ${id}`)
    return data
  }

  private sendWebhooks(user: User, movie: any) {
    this.logger.debug('sendWebhooks', { user, movie })
    new Webhook().sendTwitCasting(user, movie)
  }
}

export const twitCastingCrawler = new TwitCastingCrawler()
