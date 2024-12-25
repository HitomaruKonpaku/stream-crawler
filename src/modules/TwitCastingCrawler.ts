/* eslint-disable class-methods-use-this */

import axios from 'axios'
import * as cheerio from 'cheerio'
import EventEmitter from 'events'
import path from 'path'
import winston from 'winston'
import { APP_DEFAULT_REFRESH_INTERVAL } from '../constants/app.constant'
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
      .filter((v) => typeof v === 'string' || typeof v === 'number' || v.id)
      .map((v) => (typeof v === 'string' || typeof v === 'number' ? { id: String(v) } : v))

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
        await this.getMoveMetadata(user, movie)

        const movieUrl = TwitCastingUtil.getMovieUrl(user.id, movie.id)
        this.logger.warn(`${user.id} live: ${movieUrl}`)
        this.sendWebhooks(user, movie)

        const fileName = [
          `[${user.id.replace(/[:]/g, '_')}]`,
          `[${Util.getTimeString()}]`,
          ' ',
          `(${movie.id})`,
          '.mp4',
        ].join('')

        const output = path.join(
          configManager.getOutDir(),
          'twitcasting',
          // `[%(uploader_id)s][${Util.getTimeString()}] %(title)s (%(id)s).%(ext)s`,
          fileName,
        )

        const sleepMs = Number(process.env.TWITCASTING_DOWNLOAD_DELAY) || 0
        await Util.sleep(sleepMs)

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
    // this.logger.debug(`--> getUserStream: ${id}`)
    const { data } = await axios.get(url)
    // this.logger.debug(`<-- getUserStream: ${id}`)
    return data
  }

  private async getMoveMetadata(user: User, movie: any) {
    const url = TwitCastingUtil.getMovieUrl(user.id, movie.id)
    try {
      const { data } = await axios.get(url)
      const $ = cheerio.load(data)
      const title = $('meta[property=og:title]')?.[0]?.attribs?.content
      const description = $('meta[property=og:description]')?.[0]?.attribs?.content
      const thumbnailUrl = $('meta[property=og:image]')?.[0]?.attribs?.content
      Object.assign(movie, { title, description, thumbnailUrl })
    } catch (error) {
      this.logger.error(`getMoveMetadata: ${error.message}`, { url })
    }
  }

  private sendWebhooks(user: User, movie: any) {
    this.logger.debug('sendWebhooks', { user, movie })
    new Webhook().sendTwitCasting(user, movie)
  }
}

export const twitCastingCrawler = new TwitCastingCrawler()
