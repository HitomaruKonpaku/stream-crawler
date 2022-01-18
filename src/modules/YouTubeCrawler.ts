import axios from 'axios'
import EventEmitter from 'events'
import path from 'path'
import winston from 'winston'
import { APP_DOWNLOAD_DIR } from '../constants/app.constant'
import { Downloader } from '../Downloader'
import { youTubeLimiter } from '../Limiter'
import { logger as baseLogger } from '../logger'
import { YouTubeUtil } from '../utils/YouTubeUtil'
import { configManager } from './ConfigManager'

interface User {
  id: string
  name: string
}

export class YouTubeCrawler extends EventEmitter {
  private logger: winston.Logger
  private interval: number
  private users: User[]
  private videoIds = new Set<string>()

  constructor() {
    super()
    this.logger = baseLogger.child({ label: '[YouTubeCrawler]' })

    const config = configManager.config?.youtube || {}
    this.interval = config.interval || 30000
    this.users = (config.users || []).filter((v) => v.id)
  }

  public async start() {
    this.logger.info('start')
    this.users.forEach((user) => this.monitorUser(user))
  }

  private async monitorUser(user: User) {
    this.logger.info(`monitorUser: ${user.name}`, user)
    await this.checkUser(user)
  }

  private async checkUser(user: User) {
    try {
      const body = await youTubeLimiter.schedule(() => this.getChannelLive(user))
      this.checkUserLive(user, body)
    } catch (error) {
      this.logger.error(`checkUser: ${user.name}: ${error.message}`)
    }
    setTimeout(() => this.checkUser(user), this.interval)
  }

  private checkUserLive(user: User, body: string) {
    try {
      const isLive = true
        && body.includes('"isLive":true')
        && body.includes('watching now')
      if (!isLive) {
        return
      }
      const videoId = /(?<=watch\?v=)[0-9A-Za-z-_]{11}/g.exec(body)?.[0] as string
      if (!videoId || this.videoIds.has(videoId)) {
        return
      }
      this.videoIds.add(videoId)
      const videoUrl = YouTubeUtil.getVideoUrl(videoId)
      this.logger.info(`${user.name} live: ${videoUrl}`)
      this.sendWebhooks(user, videoId)
      const output = path.join(__dirname, APP_DOWNLOAD_DIR, 'youtube', '[%(uploader)s][%(upload_date)s] %(title)s (%(id)s).%(ext)s')
      Downloader.downloadUrl(videoUrl, { output })
    } catch (error) {
      this.logger.error(`checkUserLive ${user.name}: ${error.message}`)
    }
  }

  private async getChannelLive(user: User) {
    const url = `https://www.youtube.com/channel/${user.id}/live`
    this.logger.debug(`--> getChannelLive: ${user.name}`, { id: user.id, url })
    const { data } = await axios.get<string>(
      url,
      {
        headers: {
          'accept-language': 'en-US,en',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
        },
      },
    )
    this.logger.debug(`<-- getChannelLive: ${user.name}`)
    return data
  }

  private sendWebhooks(user: User, videoId: string) {
    this.logger.debug('sendWebhooks', { user, videoId })
    // new Webhook()
  }
}

export const youTubeCrawler = new YouTubeCrawler()
