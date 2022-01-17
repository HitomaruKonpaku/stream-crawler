import { logger } from './logger'
import { twitCastingCrawler } from './modules/TwitCastingCrawler'

logger.info(Array(80).fill('=').join(''))

twitCastingCrawler.start()
