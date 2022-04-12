import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import winston from 'winston'
import { APP_DOWNLOAD_DIR } from '../constants/app.constant'
import { logger as baseLogger } from '../logger'

class ConfigManager {
  public config: Record<string, any>

  private logger: winston.Logger

  constructor() {
    this.logger = baseLogger.child({ label: '[ConfigManager]' })
    this.config = {}
  }

  public load() {
    let config: any

    try {
      const filePath = 'config.yaml'
      const payload = readFileSync(filePath, 'utf-8')
      this.logger.info(`load: ${filePath}`)
      config = Object.assign(config || {}, yaml.load(payload))
    } catch (error) {
      this.logger.warn(`load: ${error.message}`)
    }

    if (!config) {
      try {
        const filePath = 'config.json'
        const payload = readFileSync(filePath, 'utf-8')
        this.logger.info(`load: ${filePath}`)
        config = Object.assign(config || {}, JSON.parse(payload))
      } catch (error) {
        this.logger.warn(`load: ${error.message}`)
      }
    }

    this.config = config || {}
    return this.config
  }

  public getOutDir(): string {
    const s = this.config.output ?? path.join(__dirname, APP_DOWNLOAD_DIR)
    return s
  }
}

export const configManager = new ConfigManager()
