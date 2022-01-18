import { readFileSync } from 'fs'
import path from 'path'
import winston from 'winston'
import { APP_DEFAULT_CONFIG_PATH } from '../constants/app.constant'
import { logger as baseLogger } from '../logger'

class ConfigManager {
  public config: Record<string, any>

  private logger: winston.Logger
  private configPath: string

  constructor() {
    this.logger = baseLogger.child({ label: '[ConfigManager]' })
    this.config = {}
    this.configPath = path.join(__dirname, APP_DEFAULT_CONFIG_PATH)
    this.load()
  }

  private load() {
    try {
      const config = JSON.parse(readFileSync(this.configPath, 'utf8'))
      this.logger.debug('load: success')
      Object.assign(this.config, config)
    } catch (error) {
      this.logger.error(`load: ${error.message}`)
    }
  }
}

export const configManager = new ConfigManager()
