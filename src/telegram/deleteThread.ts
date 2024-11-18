import { messageRepository, threadRepository } from "../repositories"
import ConfigManager from "../config"
import bot from "."

const deleteThread = async (threadId: number) => {

  const messages = await messageRepository.findBy({ threadId })

  try {
    await bot.telegram.deleteMessages(ConfigManager.config.telegramBot.chatId, messages.map((message) => message.id).filter((id) => id !== undefined))
  } catch (error) {
    console.error(error)
    await bot.telegram.sendMessage(ConfigManager.config.telegramBot.chatId, `删除帖子 ${threadId} 失败: ${error}`)
  }

  await threadRepository.update(threadId, { isDeleted: true })

  await messageRepository.delete({ threadId })
}

export default deleteThread