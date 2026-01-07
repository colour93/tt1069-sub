import schedule from 'node-schedule'
import { getLatestEd2kVideoThreads } from './getLatestEd2kVideoThreads'
import sendLatestEd2kVideoThread from './sendLatestEd2kVideoThread'
import scheduleCheckSubscribedNovels from './novel/checkSubscribedNovels'
import sendLatestNovelPost from './sendLatestNovelPost'
import { getLatestNovelThreads } from './getLatestNovelThreads'

const scheduler = () => {

  const getLatestEd2kVideoThreadsJob = schedule.scheduleJob('*/10 * * * *', () => {
    getLatestEd2kVideoThreads()
  })

  const sendLatestEd2kVideoThreadJob = schedule.scheduleJob('* * * * *', () => {
    sendLatestEd2kVideoThread()
  })

  const getLatestNovelThreadsJob = schedule.scheduleJob('*/10 * * * *', () => {
    getLatestNovelThreads()
  })

  const sendLatestNovelPostJob = schedule.scheduleJob('* * * * *', () => {
    sendLatestNovelPost()
  })

  // 小说订阅检查（内部自行注册计划任务）
  const novelSubscribeJob = scheduleCheckSubscribedNovels()


  process.on('SIGINT', () => {
    console.log('正在停止定时任务...')
    getLatestEd2kVideoThreadsJob.cancel()
    sendLatestEd2kVideoThreadJob.cancel()
    getLatestNovelThreadsJob.cancel()
    sendLatestNovelPostJob.cancel()
    if (novelSubscribeJob) novelSubscribeJob.cancel()
    process.exit(0)
  })

}

export default scheduler