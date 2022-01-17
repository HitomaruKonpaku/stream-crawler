import axios from 'axios'
import { randomUUID } from 'crypto'
import winston from 'winston'
import { discordWebhookLimiter } from '../Limiter'
import { logger as baseLogger } from '../logger'
import { TwitCastingUtil } from '../utils/TwitCastingUtil'
import { configManager } from './ConfigManager'

export class Webhook {
  private logger: winston.Logger

  constructor() {
    this.logger = baseLogger.child({ label: '[Webhook]' })
  }

  // eslint-disable-next-line class-methods-use-this
  private get config() {
    return configManager.config?.webhooks
  }

  public sendTwitCasting(user: any, movie: any) {
    this.sendTwitCastingDiscord(user, movie)
  }

  private async post(url: string, body: any) {
    const requestId = randomUUID()
    try {
      this.logger.debug('--> post', {
        requestId,
        url: url.replace(/.{60}$/, '****'),
        body,
      })
      const { data } = await axios.post(url, body)
      this.logger.debug('<-- post', { requestId })
      return data
    } catch (error) {
      this.logger.error(`post: ${error.message}`, { requestId })
    }
    return null
  }

  private sendTwitCastingDiscord(user: any, movie: any) {
    const configs = Array.from<any>(this.config?.discord || [])
    configs.forEach((config) => {
      if (!config.active) {
        return
      }
      const urls = Array.from<string>(config.urls || [])
        .filter((v) => v)
      const twitcastingIds = Array.from<string>(config.twitcasting || [])
        .filter((v) => v)
        .map((v) => v.toLowerCase())
      if (!urls.length || !twitcastingIds.length) {
        return
      }
      if (!twitcastingIds.find((v) => v === '<all>') && !twitcastingIds.some((v) => v === user.id.toLowerCase())) {
        return
      }
      try {
        // Build content with mentions
        let content = ''
        Array.from(config.mentions?.roleIds || []).forEach((id) => {
          content += `<@&${id}> `
        })
        Array.from(config.mentions?.userIds || []).forEach((id) => {
          content += `<@${id}> `
        })
        content = content.trim()
        // Build request payload
        const payload = {
          content,
          embeds: [
            {
              type: 'rich',
              title: 'Live!',
              description: [`${user.name || user.id} is now live`, TwitCastingUtil.getMovieUrl(user.id, movie.id)].join('\n'),
              url: `https://twitcasting.tv/${user.id}`,
              color: 0x4589ff,
              author: {
                name: user.name || user.id,
                url: `https://twitcasting.tv/${user.id}`,
                icon_url: `https:${user.image}`,
              },
              footer: {
                text: 'TwitCasting',
                icon_url: 'https://twitcasting.tv/img/icon192.png',
              },
            },
          ],
        }
        // Send
        urls.forEach((url) => discordWebhookLimiter.schedule(() => this.post(url, payload)))
      } catch (error) {
        this.logger.error(`sendTwitCastingDiscord: ${error.message}`)
      }
    })
  }
}
