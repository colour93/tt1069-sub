import AppDataSource from "./dataSource"
import { getLatestThreads } from "./schedulers/getLatestThreads"
import getCurrentUserInfo from "./tt1069/getCurrentUserInfo"

const main = async () => {

  await AppDataSource.initialize().then(() => {
    console.log('数据库连接成功')
  }).catch((error) => {
    console.error('数据库连接失败', error)
  })

  const currentUser = await getCurrentUserInfo()
  console.log(`当前登录用户：${currentUser.name} - ${currentUser.id}`)

  await getLatestThreads()

}

main() 