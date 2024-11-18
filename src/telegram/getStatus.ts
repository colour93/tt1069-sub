import { authorRepository, threadRepository } from "../repositories"

const getStatus = async () => {
  const threadCount = await threadRepository.count()
  const validThreadCount = await threadRepository.count({
    where: {
      isDeleted: false
    }
  })
  const pushedThreadCount = await threadRepository.count({
    where: {
      isPushed: true,
      isDeleted: false
    }
  })
  const authorCount = await authorRepository.count()
  const latestThread = await threadRepository.find({
    order: {
      id: 'DESC'
    },
    take: 1
  }).then((threads) => threads.length > 0 ? threads[0] : null)
  return {
    thread: {
      total: threadCount,
      valid: validThreadCount,
      pushed: pushedThreadCount,
      latestPublishedAt: latestThread?.publishedAt
    },
    author: {
      total: authorCount
    }
  }
}

export default getStatus