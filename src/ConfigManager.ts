import { readFileSync } from 'fs'
import path from 'path'
import winston from 'winston'
import { APP_DEFAULT_CONFIG_PATH } from './constants/app.constant'
import { logger as baseLogger } from './logger'

class ConfigManager {
  public config: Record<string, any>

  private logger: winston.Logger
  private configPath: string

  constructor() {
    this.logger = baseLogger.child({ label: '[Config]' })
    this.configPath = path.join(__dirname, APP_DEFAULT_CONFIG_PATH)
    this.loadConfig()
  }

  private loadConfig() {
    try {
      const config = JSON.parse(readFileSync(this.configPath, 'utf8'))
      this.logger.debug('loadConfig', config)
      this.config = config
    } catch (error) {
      this.logger.error(`loadConfig: ${error.message}`)
    }
  }
}

export const configManager = new ConfigManager()
