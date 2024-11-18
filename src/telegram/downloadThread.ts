import bot from "."
import ConfigManager from "../config"
import { messageRepository, threadRepository } from "../repositories"
import { ed2kRegex, ed2kRegexMd } from "../utils"

const downloadThread = async (threadId: number) => {

  console.log(`开始下载帖子 ${threadId}`)

  const thread = await threadRepository.findOneBy({ id: threadId })

  if (!thread) {
    console.log(`帖子 ${threadId} 不存在`)
    bot.telegram.sendMessage(ConfigManager.config.telegramBot.chatId, `帖子 ${threadId} 不存在`)
    return
  }

  const ed2k = thread.ed2kList?.[0]
  if (!ed2k) {
    bot.telegram.sendMessage(ConfigManager.config.telegramBot.chatId, `帖子 ${threadId} 没有 ED2K 链接`)
    return
  }

  const messages = await messageRepository.findBy({ threadId, type: 'text' })

  for (const message of messages) {
    if (message.textMessage) {
      let text = message.textMessage.replace(ed2kRegexMd, '')
      text += '✅ 已开始下载'
      await bot.telegram.editMessageText(ConfigManager.config.telegramBot.chatId, message.id, undefined, text, {
        parse_mode: 'Markdown',
        link_preview_options: {
          is_disabled: true
        },
      })
    }
  }

  // bot.telegram.sendMessage(ConfigManager.config.telegramBot.chatId, ed2k)
}

export default downloadThread