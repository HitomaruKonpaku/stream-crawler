import 'dotenv/config'
import { logger } from './logger'
import { configManager } from './modules/ConfigManager'
import { twitCastingCrawler } from './modules/TwitCastingCrawler'
import { youTubeCrawler } from './modules/YouTubeCrawler'

logger.info(Array(80).fill('=').join(''))

async function main() {
  configManager.load()
  twitCastingCrawler.start()
  youTubeCrawler.start()
}

main()
