import * as fs from 'fs/promises'
import * as path from 'path'
import _ from 'lodash'

export type Config = {
  db: {
    type: 'postgres'
    host?: string
    port?: number
    username?: string
    password?: string
    database?: string
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
}

const configPath = path.resolve('data', 'config.json')

const defaultConfig: Config = {
  db: {
    type: 'postgres',
  },
  request: {
    cookie: ''
  }
}

class ConfigManager {
  public static config = defaultConfig

  public static async initConfig(): Promise<void> {
    return new Promise(async (resolve) => {
      console.log('初始化配置')
      try {
        await fs.access(configPath)
      } catch {
        await fs.mkdir(path.dirname(configPath), { recursive: true })
        await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2))
      }
      const config = await fs.readFile(configPath, 'utf8')
      try {
        ConfigManager.config = JSON.parse(config)
      } catch (error) {
        console.error('读取配置文件失败', error)
        ConfigManager.config = defaultConfig
      } finally {
        console.log('读取配置文件完毕')
        resolve()
      }
    })
  }

  public static async updateConfig(config: Partial<ConfigManager>): Promise<void> {
    _.merge(ConfigManager.config, config)
    await fs.writeFile(configPath, JSON.stringify(ConfigManager.config, null, 2))
  }

  public static getConfig(): Config {
    return ConfigManager.config
  }
}

export default ConfigManager
