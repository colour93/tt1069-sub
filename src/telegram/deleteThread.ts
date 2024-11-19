import { messageRepository, threadRepository } from "../repositories"
import ConfigManager from "../config"
import bot from "."
import { Context } from "telegraf"

const deleteThread = async (threadId: number, ctx?: Context) => {

  const chatId = ctx?.chat?.id || ctx?.from?.id || ConfigManager.config.telegramBot.chatId

  const messages = await messageRepository.findBy({ threadId })

  try {
    const chatMessageMapper = messages.reduce((acc, message) => {
      const index = (message.chatId || ConfigManager.config.telegramBot.chatId).toString();
      if (!acc[index]) acc[index] = []
      acc[index].push(message.id)
      return acc
    }, {} as Record<string, number[]>)
    for (const chatId of Object.keys(chatMessageMapper)) {
      await bot.telegram.deleteMessages(chatId, chatMessageMapper[chatId])
    }
  } catch (error) {
    console.error(error)
    await bot.telegram.sendMessage(chatId, `删除帖子 ${threadId} 失败: ${error}`)
  }

  await threadRepository.update(threadId, { isDeleted: true })

  await messageRepository.delete({ threadId })
}

export default deleteThread