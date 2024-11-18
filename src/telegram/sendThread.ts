import { MessageEntity } from "telegraf/typings/core/types/typegram";
import { ThreadEntity } from "../entities/Thread";
import bot from ".";
import ConfigManager from "../config";
import { messageRepository } from "../repositories";

const sendThread = async (thread: ThreadEntity | Omit<ThreadEntity, 'isPushed' | 'isDeleted' | 'isDownloaded'>, saveToDb = true) => {
  console.log(`正在推送帖子 ${thread.id} 的数据`)

  let msg = `#${thread.category} **${thread.title}**\n`;

  msg += `\n`

  msg += `发布时间: ${thread.publishedAt.toLocaleString()}\n`

  msg += `ID: ${thread.id}  [论坛原始链接](https://www.tt1069.com/bbs/thread-${thread.id}-1-1.html)\n`

  const ed2kStyleList: MessageEntity[] = []
  if (thread.ed2kList) {
    for (const ed2k of thread.ed2kList) {
      ed2kStyleList.push({ type: 'code', offset: msg.length, length: ed2k.length })
      msg += `\n\`${ed2k}\``
    }
  }

  if (thread.imgList && thread.imgList.length > 0) {
    const mediaMessage = await bot.telegram.sendMediaGroup(ConfigManager.config.telegramBot.chatId, thread.imgList.map((img) => ({ type: 'photo', media: img, caption: thread.title })))
    if (saveToDb) await messageRepository.save(
      mediaMessage.map((message) => ({ id: message.message_id, threadId: thread.id, type: 'media' }))
    )
  }


  const message = await bot.telegram.sendMessage(ConfigManager.config.telegramBot.chatId, msg, {
    parse_mode: 'Markdown',
    link_preview_options: {
      is_disabled: true
    },
    reply_markup: {
      inline_keyboard: [
        [
          { text: '下载', callback_data: `download:${thread.id}` },
          { text: '删除', callback_data: `delete:${thread.id}` },
        ]
      ]
    }
  })

  if (saveToDb) await messageRepository.save(
    { id: message.message_id, threadId: thread.id, type: 'text', textMessage: msg }
  )

  console.log(`帖子 ${thread.id} 的数据推送成功`)
}

export default sendThread