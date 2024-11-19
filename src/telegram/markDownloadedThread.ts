import { Context } from "telegraf";
import { ed2kRegexMd } from "../utils";
import bot from ".";
import ConfigManager from "../config";
import { messageRepository } from "../repositories";

const markDownloadedThread = async (threadId: number, ctx: Context) => {

  const chatId = ctx?.chat?.id || ctx?.from?.id || ConfigManager.config.telegramBot.chatId

  const messages = await messageRepository.findBy({ threadId, type: 'text' })

  for (const message of messages) {
    if (message.textMessage) {
      let text = message.textMessage.replace(ed2kRegexMd, '')
      text += '✅ 已标记下载'
      await bot.telegram.editMessageText(chatId, message.id, undefined, text, {
        parse_mode: 'Markdown',
        link_preview_options: {
          is_disabled: true
        },
      })
    }
  }
}

export default markDownloadedThread