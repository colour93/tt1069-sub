import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import ConfigManager from "../config";
import { HttpsProxyAgent } from "https-proxy-agent";
import downloadThread from "./downloadThread";
import deleteThread from "./deleteThread";
import getStatus from "./getStatus";
import getThread from "./getThread";
import sendThread from "./sendThread";

const bot = new Telegraf(ConfigManager.config.telegramBot.token, ConfigManager.config.telegramBot.proxy ? {
  telegram: {
    agent: new HttpsProxyAgent(ConfigManager.config.telegramBot.proxy)
  }
} : undefined)

bot.on(message('text'), async (ctx) => {
  if (ctx.message.text === '/id') {
    await ctx.reply(`uid: ${ctx.message.from.id}\n gid: ${ctx.message.chat.id}`)
  }
  if (ctx.message.text === '/status') {
    const status = await getStatus()
    await ctx.reply(`帖子总数: ${status.thread.total}\n有效帖子数: ${status.thread.valid}\n已推送帖子数: ${status.thread.pushed}\n最新帖子发布时间: ${status.thread.latestPublishedAt?.toLocaleString()}\n作者总数: ${status.author.total}`)
  }
  const threadMatch = ctx.message.text.match(/\/thread (\d+)/);
  if (threadMatch) {
    const thread = await getThread(Number(threadMatch[1]))
    if (thread) {
      await sendThread(thread, true, ctx)
    } else {
      await ctx.reply(`帖子不存在`)
    }
  }
})

bot.action(/^download:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery("开始下载")
  const threadId = Number(ctx.match[1])
  if (isNaN(threadId)) {
    try {
      await ctx.answerCbQuery("帖子 ID 不正确")
    } catch (error) {
      console.error(error)
    }
    return
  }
  await downloadThread(threadId, ctx)
})

bot.action(/^delete:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery("已删除")
  } catch (error) {
    console.error(error)
  }
  const threadId = Number(ctx.match[1])
  if (isNaN(threadId)) {
    try {
      await ctx.answerCbQuery("帖子 ID 不正确")
    } catch (error) {
      console.error(error)
    }
    return
  }
  await deleteThread(threadId, ctx)
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

export default bot