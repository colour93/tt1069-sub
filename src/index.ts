import AppDataSource from "./dataSource"
import scheduler from "./schedulers"
import SynologyService from "./synology"
import bot from "./telegram"
import getCurrentUserInfo from "./tt1069/getCurrentUserInfo"

const main = async () => {

  await AppDataSource.initialize().then(() => {
    console.log('数据库连接成功')
  }).catch((error) => {
    console.error('数据库连接失败', error)
  })

  const loginResult = await SynologyService.init()
  console.log(loginResult.success ? '群晖登录成功' : '群晖登录失败')

  console.log(await SynologyService.listDownloadStation2EmuleTask())

  const currentUser = await getCurrentUserInfo()
  console.log(`当前登录用户：${currentUser.name} - ${currentUser.id}`)

  bot.launch()
  console.log('Telegram Bot 启动成功')

  scheduler()
  console.log('调度器启动成功')
}

main() 