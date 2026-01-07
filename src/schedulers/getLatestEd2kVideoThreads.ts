import { updateEd2kVideoThreadList } from "../tt1069/updateEd2kVideoThreadList"

export const getLatestEd2kVideoThreads = async () => {

  console.log('开始获取最新 ED2K 视频帖子')

  await updateEd2kVideoThreadList()
}

