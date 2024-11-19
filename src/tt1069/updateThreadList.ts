import { In } from "typeorm"
import { threadRepository, authorRepository } from "../repositories"
import getThreadData from "./getThreadData"
import getThreadList from "./getThreadList"
import { Context } from "telegraf"

export const updateThreadList = async (pages?: number, ctx?: Context) => {

  console.log('开始更新帖子')

  let message;

  if (ctx) {
    message = await ctx.reply(`开始更新帖子`)
  }

  const latestExistThread = await threadRepository.find({
    order: {
      publishedAt: 'DESC'
    },
    take: 1
  }).then(res => res.length > 0 ? res[0] : null)

  const threads = await getThreadList(latestExistThread && !pages ? {
    targetId: latestExistThread.id,
  } : {
    maxPage: pages || 1
  })

  const existingThreadIds = await threadRepository.find({
    select: ['id'],
    where: {
      id: In(threads.map(t => t.id))
    }
  }).then(res => res.map(t => t.id))

  const newThreads = threads.filter(t => !existingThreadIds.includes(t.id))
  threads.splice(0, threads.length, ...newThreads)

  if (message && ctx) {
    await ctx.telegram.editMessageText(message.chat.id, message.message_id, undefined, `获取到 ${threads.length} 条帖子`)
  }

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

    await threadRepository.upsert(newThread, ['id'])
  }

  if (message && ctx) {
    await ctx.telegram.editMessageText(message.chat.id, message.message_id, undefined, '更新帖子完成')
  }

  console.log('更新帖子完成')
}