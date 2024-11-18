import { threadRepository } from "../repositories"
import sendThread from "../telegram/sendThread"

const sendLatestThread = async () => {
  const latestThread = await threadRepository.find({
    where: {
      isPushed: false,
      isDeleted: false
    },
    order: {
      publishedAt: 'DESC'
    },
    take: 1
  }).then(res => res.length > 0 ? res[0] : null)

  if (latestThread) {
    await sendThread(latestThread)

    await threadRepository.update(latestThread.id, { isPushed: true })
  }
}

export default sendLatestThread