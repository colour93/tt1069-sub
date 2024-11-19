import { messageRepository, threadRepository } from "../repositories"
import ConfigManager from "../config"
import bot from "."
import { Context } from "telegraf"

const deleteThread = async (threadId: number, ctx?: Context) => {

  const chatId = ctx?.chat?.id || ctx?.from?.id || ConfigManager.config.telegramBot.chatId

  const messages = await messageRepository.findBy({ threadId })

  try {
    const chatMessageMapper = messages.reduce((acc, message) => {
      acc[message.chatId || ConfigManager.config.telegramBot.chatId] = message.id
      return acc
    }, {} as Record<number, number>)
    for (const chatId in chatMessageMapper) {
      await bot.telegram.deleteMessages(chatId, [chatMessageMapper[chatId]])
    }
  } catch (error) {
    console.error(error)
    await bot.telegram.sendMessage(chatId, `删除帖子 ${threadId} 失败: ${error}`)
  }

  await threadRepository.update(threadId, { isDeleted: true })

  await messageRepository.delete({ threadId })
}

export default deleteThread