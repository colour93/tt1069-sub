import { ThreadEntity } from "../entities/Thread"
import { threadRepository } from "../repositories"
import getThreadData from "../tt1069/getThreadData"

const getThread = async (threadId: number) => {
  let thread: ThreadEntity | Omit<ThreadEntity, 'isPushed' | 'isDeleted' | 'isDownloaded'> | null = await threadRepository.findOneBy({ id: threadId })

  try {
    if (!thread) thread = await getThreadData(threadId)
  } catch (error) {
    console.error(`获取帖子 ${threadId} 失败`, error)
  }

  return thread
}

export default getThread