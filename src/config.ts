import * as fs from 'fs'
import * as path from 'path'
import _ from 'lodash'

export type Config = {
  db: {
    type: 'postgres'
    host: string
    port: number
    username: string
    password: string
    database: string
    synchronize?: boolean
    logging?: boolean
  }
  request: {
    cookie: string,
    proxy?: {
      host: string,
      port: number,
      protocol: string
    }
  }
  telegramBot: {
    token: string,
    proxy?: string,
    chatId: number
  }
  synology?: {
    baseUrl: string,
    account: string,
    passwd: string,
    download: {
      destination: string
    }
  }
}

const configPath = path.resolve('data', 'config.json')

const defaultConfig: Config = {
  db: {
    type: 'postgres',
    host: '',
    port: 5432,
    username: '',
    password: '',
    database: ''
  },
  request: {
    cookie: ''
  },
  telegramBot: {
    token: '',
    chatId: 0
  }
}

class ConfigManager {
  public static config = this.initConfig()

  private static initConfig(): Config {
    console.log('初始化配置')
    try {
      fs.accessSync(configPath)
    } catch {
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
    }
    const config = fs.readFileSync(configPath, 'utf8')
    try {
      return JSON.parse(config)
    } catch (error) {
      console.error('读取配置文件失败', error)
      return defaultConfig
    } finally {
      console.log('读取配置文件完毕')
    }
  }

  public static async updateConfig(config: Partial<ConfigManager>): Promise<void> {
    _.merge(ConfigManager.config, config)
    fs.writeFileSync(configPath, JSON.stringify(ConfigManager.config, null, 2))
  }

  public static getConfig(): Config {
    return ConfigManager.config
  }
}

export default ConfigManager
