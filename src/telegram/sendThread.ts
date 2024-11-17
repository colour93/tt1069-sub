import { MessageEntity } from "telegraf/typings/core/types/typegram";
import { Thread } from "../entities/Thread";
import bot from ".";
import ConfigManager from "../config";

const sendThread = async (thread: Thread) => {
  console.log(`正在推送帖子 ${thread.id} 的数据`)
  let msg = `#${thread.category} `;

  const titleOffset = msg.length
  const titleLength = thread.title.length
  msg += `${thread.title}\n`

  msg += `\n`

  const ed2kStyleList: MessageEntity[] = []
  if (thread.ed2kList) {
    for (const ed2k of thread.ed2kList) {
      ed2kStyleList.push({ type: 'code', offset: msg.length, length: ed2k.length })
      msg += `${ed2k}\n`
    }
  }
  thread.imgList && thread.imgList.length > 0 && await bot.telegram.sendMediaGroup(ConfigManager.config.telegramBot.chatId, thread.imgList.map((img) => ({ type: 'photo', media: img, caption: thread.title })))

  msg += '\n'

  const urlOffset = msg.length
  const urlLength = '论坛原始链接'.length
  msg += '论坛原始链接\n'

  await bot.telegram.sendMessage(ConfigManager.config.telegramBot.chatId, msg, {
    entities: [
      { type: 'bold', offset: titleOffset, length: titleLength },
      ...ed2kStyleList,
      { type: 'text_link', offset: urlOffset, length: urlLength, url: `https://www.tt1069.com/bbs/thread-${thread.id}-1-1.html` }
    ],
    link_preview_options: {
      is_disabled: true
    },
    reply_markup: {
      inline_keyboard: [
        [{ text: '下载', callback_data: `download` }]
      ]
    }
  })
  console.log(`帖子 ${thread.id} 的数据推送成功`)
}

export default sendThread