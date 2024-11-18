import schedule from 'node-schedule'
import { getLatestThreads } from './getLatestThreads'
import sendLatestThread from './sendLatestThread'

const scheduler = () => {

  const getLatestThreadsJob = schedule.scheduleJob('*/10 * * * *', () => {
    getLatestThreads()
  })

  const sendLatestThreadJob = schedule.scheduleJob('* * * * *', () => {
    sendLatestThread()
  })


  process.on('SIGINT', () => {
    console.log('正在停止定时任务...')
    getLatestThreadsJob.cancel()
    sendLatestThreadJob.cancel()
    process.exit(0)
  })

}

export default scheduler