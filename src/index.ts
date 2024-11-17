import ConfigManager from "./config"


const main = async () => {

  await ConfigManager.initConfig()

  const AppDataSource = await import('./dataSource')
  await AppDataSource.default.initialize().then(() => {
    console.log('数据库连接成功')
  }).catch((error) => {
    console.error('数据库连接失败', error)
  })

}

main() 