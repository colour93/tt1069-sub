import AppDataSource from "../dataSource"
import { Author } from "../entities/Author"
import { Thread } from "../entities/Thread"
import getThreadData from "../tt1069/getThreadData"
import getThreadList from "../tt1069/getThreadList"

export const getLatestThreads = async () => {

  const threadRepository = AppDataSource.getRepository(Thread)
  const authorRepository = AppDataSource.getRepository(Author)

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
    let author = await authorRepository.findOne({
      where: {
        id: thread.author.id
      }
    })
    if (!author) {
      author = await authorRepository.save(thread.author)
    }
    threads[index] = {
      ...thread,
      ...threadData
    }
  }

  await threadRepository.save(threads)

}