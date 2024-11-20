import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import ConfigManager from "../config";
import { HttpsProxyAgent } from "https-proxy-agent";
import downloadThread from "./downloadThread";
import deleteThread from "./deleteThread";
import getStatus from "./getStatus";
import getThread from "./getThread";
import sendThread from "./sendThread";
import getThreadList from "../tt1069/getThreadList";
import { updateThreadList } from "../tt1069/updateThreadList";
import markDownloadedThread from "./markDownloadedThread";

const bot = new Telegraf(ConfigManager.config.telegramBot.token, ConfigManager.config.telegramBot.proxy ? {
  telegram: {
    agent: new HttpsProxyAgent(ConfigManager.config.telegramBot.proxy)
  }
} : undefined)

bot.telegram.setMyCommands([
  { command: 'id', description: '获取用户及群组 ID' },
  { command: 'status', description: '获取帖子状态' },
  { command: 'thread', description: '获取帖子信息' },
  { command: 'update_threads', description: '更新多页帖子列表' },
])

bot.on(message('text'), async (ctx) => {
  if (ctx.message.text === '/id') {
    ctx.reply(`uid: ${ctx.message.from.id}\n gid: ${ctx.message.chat.id}`)
  }
  if (ctx.message.text === '/status') {
    const status = await getStatus()
    ctx.reply(`帖子总数: ${status.thread.total}\n有效帖子数: ${status.thread.valid}\n已推送帖子数: ${status.thread.pushed}\n最新帖子发布时间: ${status.thread.latestPublishedAt?.toLocaleString()}\n作者总数: ${status.author.total}`)
  }
  const threadMatch = ctx.message.text.match(/\/thread (\d+)/);
  if (threadMatch) {
    const thread = await getThread(Number(threadMatch[1]))
    if (thread) {
      sendThread(thread, true, ctx)
    } else {
      ctx.reply(`帖子不存在`)
    }
  }
  const updateThreadsMatch = ctx.message.text.match(/\/update_threads (\d+)/);
  if (updateThreadsMatch) {
    const page = Number(updateThreadsMatch[1])
    updateThreadList(page, ctx)
  }
})

bot.action(/^download:(\d+)$/, async (ctx) => {
  try {
    const threadId = Number(ctx.match[1])
    if (isNaN(threadId)) {
      await ctx.answerCbQuery("帖子 ID 不正确").catch(() => { })

      return
    }
    const result = await downloadThread(threadId, ctx)
    if (result && result.success) {
      await ctx.answerCbQuery("开始下载").catch(() => { })
    } else if (result && result.error.code === -1) {
      await ctx.answerCbQuery("已发送 ED2K 选择请求").catch(() => { })
    } else {
      await ctx.answerCbQuery(result ? `下载失败，错误码：${result.error.code}` : "下载失败").catch(() => { })
    }
  } catch (error) {
    console.error(error)
  }
})

bot.action(/^delete:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery("已删除")

    const threadId = Number(ctx.match[1])
    if (isNaN(threadId)) {

      await ctx.answerCbQuery("帖子 ID 不正确")
      return
    }
    await deleteThread(threadId, ctx)
  } catch (error) {
    console.error(error)
  }
})

bot.action(/^download-confirm:(\d+)_(.*)$/, async (ctx) => {
  try {
    const threadId = Number(ctx.match[1])
    if (isNaN(threadId)) {
      await ctx.answerCbQuery("帖子 ID 不正确").catch(() => { })
      return
    }
    const index = Number(ctx.match[2])
    if (isNaN(index)) {
      await ctx.answerCbQuery("链接序号不正确").catch(() => { })
      return
    }
    const result = await downloadThread(threadId, ctx, index)
    if (result && result.success) {
      await ctx.answerCbQuery("开始下载").catch(() => { })
    } else {
      await ctx.answerCbQuery(result ? `下载失败，错误码：${result.error.code}` : "下载失败").catch(() => { })
    }
  } catch (error) {
    console.error(error)
  }
})

bot.action(/^download-mark:(\d+)$/, async (ctx) => {
  try {
    const threadId = Number(ctx.match[1])
    if (isNaN(threadId)) {
      await ctx.answerCbQuery("帖子 ID 不正确").catch(() => { })

      return
    }
    await markDownloadedThread(threadId, ctx)
    await ctx.answerCbQuery("已标记").catch(() => { })
  } catch (error) {
    console.error(error)
  }
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

export default bot