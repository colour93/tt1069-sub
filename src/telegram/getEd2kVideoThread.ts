import { ThreadEntity } from "../entities/Thread"
import { threadRepository } from "../repositories"
import getThreadData from "../tt1069/getEd2kVideoThreadData"

const getEd2kVideoThread = async (threadId: number) => {
  let thread: ThreadEntity | Omit<ThreadEntity, 'isPushed' | 'isDeleted' | 'isDownloaded'> | null = await threadRepository.findOneBy({ id: threadId })

  try {
    if (!thread) thread = await getThreadData(threadId)
  } catch (error) {
    console.error(`获取 ED2K 视频帖子 ${threadId} 失败`, error)
  }

  console.log(thread)

  return thread
}

export default getEd2kVideoThread

