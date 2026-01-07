import { threadRepository } from "../repositories"
import sendEd2kVideoThread from "../telegram/sendEd2kVideoThread"

const sendLatestEd2kVideoThread = async () => {
  const latestThread = await threadRepository.find({
    where: {
      isDownloaded: false,
      isPushed: false,
      isDeleted: false
    },
    order: {
      publishedAt: 'ASC'
    },
    take: 1
  }).then(res => res.length > 0 ? res[0] : null)

  if (latestThread) {
    await sendEd2kVideoThread(latestThread)

    await threadRepository.update(latestThread.id, { isPushed: true })
  }
}

export default sendLatestEd2kVideoThread

