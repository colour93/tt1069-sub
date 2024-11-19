import bot from "."
import ConfigManager from "../config"
import { messageRepository, threadRepository } from "../repositories"
import SynologyService from "../synology"
import { ed2kRegexMd } from "../utils"
import { Context } from "telegraf"

const downloadThread = async (threadId: number, ctx?: Context) => {

  console.log(`开始下载帖子 ${threadId}`)

  const chatId = ctx?.chat?.id || ctx?.from?.id || ConfigManager.config.telegramBot.chatId

  const thread = await threadRepository.findOneBy({ id: threadId })

  if (!thread) {
    console.log(`帖子 ${threadId} 不存在`)
    bot.telegram.sendMessage(chatId, `帖子 ${threadId} 不存在`)
    return
  }

  if (!thread.ed2kList?.length) {
    bot.telegram.sendMessage(chatId, `帖子 ${threadId} 没有 ED2K 链接`)
    return
  }

  const downloadResult = await SynologyService.createDownloadStation2EmuleTask(thread.ed2kList)

  if (!downloadResult.success) {
    return downloadResult
  }

  const messages = await messageRepository.findBy({ threadId, type: 'text' })

  for (const message of messages) {
    if (message.textMessage) {
      let text = message.textMessage.replace(ed2kRegexMd, '')
      text += '✅ 已开始下载'
      await bot.telegram.editMessageText(chatId, message.id, undefined, text, {
        parse_mode: 'Markdown',
        link_preview_options: {
          is_disabled: true
        },
      })
    }
  }

  return downloadResult
}

export default downloadThread