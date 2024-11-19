import { threadRepository, authorRepository } from "../repositories"
import getThreadData from "../tt1069/getThreadData"
import getThreadList from "../tt1069/getThreadList"

export const getLatestThreads = async () => {

  console.log('开始获取最新帖子')

  const latestExistThread = await threadRepository.find({
    order: {
      publishedAt: 'DESC'
    },
    take: 1
  }).then(res => res.length > 0 ? res[0] : null)

  const threads = await getThreadList(latestExistThread ? {
    targetId: latestExistThread.id,
  } : {
    maxPage: 1
  })

  console.log(`获取到 ${threads.length} 条帖子`)

  for (const [index, thread] of threads.entries()) {
    console.log(`正在获取第 ${index + 1} 条帖子 ${thread.id} 的数据`)
    const threadData = await getThreadData(thread.id)
    if (thread.author) {
      let author = await authorRepository.findOne({
        where: {
          id: thread.author.id
        }
      })
      if (!author) {
        author = await authorRepository.save(thread.author)
      }
    }

    const newThread = {
      ...threadData,
      ...thread,
    }

    await threadRepository.save(newThread)
  }

  console.log('获取最新帖子完成')
}