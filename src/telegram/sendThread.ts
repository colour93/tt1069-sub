import { ThreadEntity } from "../entities/Thread";
import bot from ".";
import ConfigManager from "../config";
import { messageRepository } from "../repositories";
import { Context } from "telegraf";

const sendThread = async (thread: ThreadEntity | Omit<ThreadEntity, 'isPushed' | 'isDeleted' | 'isDownloaded'>, saveToDb = true, ctx?: Context) => {
  console.log(`正在推送帖子 ${thread.id} 的数据`)

  const chatId = ctx?.chat?.id || ctx?.from?.id || ConfigManager.config.telegramBot.chatId

  let msg = `#${thread.category} **${thread.title}**\n`;

  msg += `\n`

  msg += `发布时间: ${thread.publishedAt.toLocaleString()}\n`

  msg += `ID: ${thread.id}  [论坛原始链接](https://www.tt1069.com/bbs/thread-${thread.id}-1-1.html)\n`

  if (thread.ed2kList) {
    for (const ed2k of thread.ed2kList) {
      msg += `\n\`${ed2k}\``
    }
  }

  if (thread.imgList && thread.imgList.length > 0) {
    try {
      const mediaMessage = await bot.telegram.sendMediaGroup(chatId, thread.imgList.map((img) => ({ type: 'photo', media: img, caption: thread.title })))
      if (saveToDb) await messageRepository.save(
        mediaMessage.map((message) => ({ id: message.message_id, threadId: thread.id, type: 'media', chatId }))
      )
    } catch (error) {
      try {
        const mediaMessage = await bot.telegram.sendMediaGroup(chatId, thread.imgList.map((img) => ({ type: 'photo', media: 'https://proxy.imparty.cn/' + img, caption: thread.title })))
        if (saveToDb) await messageRepository.save(
          mediaMessage.map((message) => ({ id: message.message_id, threadId: thread.id, type: 'media', chatId }))
        )
      } catch (error) {
        console.error(`发送帖子 ${thread.id} 的图片失败`, error)
      }
    }
  }

  let message;

  try {
    message = await bot.telegram.sendMessage(chatId, msg, {
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

  } catch (error) {

    try {
      message = await bot.telegram.sendMessage(chatId, msg, {
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
    } catch (error) {
      console.error(`发送帖子 ${thread.id} 的文本失败`, error)
    }
  }

  if (saveToDb && message) await messageRepository.save(
    { id: message.message_id, threadId: thread.id, type: 'text', textMessage: msg, chatId }
  )

  console.log(`帖子 ${thread.id} 的数据推送成功`)
}

export default sendThread