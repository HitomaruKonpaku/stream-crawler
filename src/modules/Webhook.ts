import axios from 'axios'
import { randomUUID } from 'crypto'
import winston from 'winston'
import { discordWebhookLimiter } from '../Limiter'
import { logger as baseLogger } from '../logger'
import { TwitCastingUtil } from '../utils/TwitCastingUtil'
import { YouTubeUtil } from '../utils/YouTubeUtil'
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

  public sendYouTube(user: any, videoId: string) {
    this.sendYouTubeDiscord(user, videoId)
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
      this.logger.error(`post: ${error.message}`, { requestId, body })
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
        // Build content
        let content = ''
        Array.from(config.mentions?.roleIds || []).forEach((id) => {
          content += `<@&${id}> `
        })
        Array.from(config.mentions?.userIds || []).forEach((id) => {
          content += `<@${id}> `
        })
        content = content.trim()

        // Build embed
        const embed = {
          type: 'rich',
          title: `${user.id} live!`,
          description: TwitCastingUtil.getMovieUrl(user.id, movie.id),
          url: TwitCastingUtil.getUserUrl(user.id),
          color: 0x4589ff,
          author: {
            name: user.name || user.id,
            url: TwitCastingUtil.getUserUrl(user.id),
            icon_url: TwitCastingUtil.getUserImageUrl(user),
          },
          fields: [],
          footer: {
            text: 'TwitCasting',
            icon_url: 'https://twitcasting.tv/img/icon192.png',
          },
        }

        if (movie.title) {
          embed.fields.push({ name: 'Title', value: movie.title })
        }
        if (movie.description) {
          embed.fields.push({ name: 'Description', value: movie.description })
        }
        if (movie.thumbnailUrl) {
          Object.assign(embed, { image: { url: movie.thumbnailUrl } })
        }

        // Build request payload
        const payload = {
          content,
          embeds: [embed],
        }

        // Send
        urls.forEach((url) => discordWebhookLimiter.schedule(() => this.post(url, payload)))
      } catch (error) {
        this.logger.error(`sendTwitCastingDiscord: ${user.id}: ${error.message}`)
      }
    })
  }

  private sendYouTubeDiscord(user: any, videoId: string) {
    const configs = Array.from<any>(this.config?.discord || [])
    configs.forEach((config) => {
      if (!config.active) {
        return
      }
      const urls = Array.from<string>(config.urls || [])
        .filter((v) => v)
      const channelIds = Array.from<string>(config.youtube || [])
        .filter((v) => v)
        .map((v) => v.toLowerCase())
      if (!urls.length || !channelIds.length) {
        return
      }
      if (!channelIds.find((v) => v === '<all>') && !channelIds.some((v) => v === user.id.toLowerCase())) {
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
        content = [content, YouTubeUtil.getVideoUrl(videoId)].map((v) => v.trim()).join('\n')
        // Build request payload
        const payload = { content }
        // Send
        urls.forEach((url) => discordWebhookLimiter.schedule(() => this.post(url, payload)))
      } catch (error) {
        this.logger.error(`sendYouTubeDiscord: ${user.name || user.id}: ${error.message}`)
      }
    })
  }
}
