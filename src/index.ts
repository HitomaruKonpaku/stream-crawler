import axios from 'axios'
import { logger } from './logger'
import { configManager } from './modules/ConfigManager'
import { twitCastingCrawler } from './modules/TwitCastingCrawler'

logger.info(Array(50).fill('=').join(''))

twitCastingCrawler.on('live', async ({ user }) => {
  const webhooks: any[] = configManager.config?.twitcasting?.discordWebhooks || []
  if (!webhooks.length) {
    return
  }

  const baseData = {
    embeds: [
      {
        type: 'rich',
        title: 'Live!',
        description: `${user.name || user.id} is now live`,
        url: `https://twitcasting.tv/${user.id}`,
        color: 0x4589ff,
        author: {
          name: user.name || user.id,
          url: `https://twitcasting.tv/${user.id}`,
          icon_url: `https:${user.image}`,
        },
      },
    ],
  }

  webhooks.forEach(async (webhook) => {
    const { url } = webhook
    if (!url) {
      return
    }
    const data = { ...baseData }
    if (webhook.users?.length) {
      Object.assign(data, { content: webhook.users.map((v) => `<@${v}>`).join(' ') })
    }
    try {
      logger.debug('Webhook data', { url, data })
      await axios.post(url, data)
      logger.debug('Webhook sent', { url })
    } catch (error) {
      logger.error(`Webhook failed to send. Error: ${error.message}`, { url })
    }
  })
})

twitCastingCrawler.start()
