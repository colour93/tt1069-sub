import schedule from 'node-schedule'
import { getLatestThreads } from './getLatestThreads'

const scheduler = () => {

  const getLatestThreadsJob = schedule.scheduleJob('30 * * * * *', () => {
    getLatestThreads()
  })

}

export default scheduler