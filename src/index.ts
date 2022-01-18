import { logger } from './logger'
import { twitCastingCrawler } from './modules/TwitCastingCrawler'
import { youTubeCrawler } from './modules/YouTubeCrawler'

logger.info(Array(80).fill('=').join(''))

twitCastingCrawler.start()
youTubeCrawler.start()
