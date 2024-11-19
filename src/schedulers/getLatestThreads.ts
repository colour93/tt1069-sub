import { updateThreadList } from "../tt1069/updateThreadList"

export const getLatestThreads = async () => {

  console.log('开始获取最新帖子')

  await updateThreadList()
}
