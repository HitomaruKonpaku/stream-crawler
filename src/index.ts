import 'dotenv/config'
import { logger } from './logger'
import { configManager } from './modules/ConfigManager'
import { twitCastingCrawler } from './modules/TwitCastingCrawler'

logger.info(Array(80).fill('=').join(''))

async function main() {
  configManager.load()
  twitCastingCrawler.start()
  // youTubeCrawler.start()
}

main()
