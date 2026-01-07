import bot from "."
import ConfigManager from "../config"
import { messageRepository, threadRepository } from "../repositories"
import SynologyService from "../synology"
import { ed2kRegexMd } from "../utils"
import { Context } from "telegraf"

const downloadEd2kVideoThread = async (threadId: number, ctx: Context, specificEd2k?: number) => {

  console.log(`开始下载 ED2K 视频帖子 ${threadId}`)

  const chatId = ctx.chat?.id || ctx.from?.id || ConfigManager.config.telegramBot.chatId

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

  let ed2kToDownload = thread.ed2kList;

  if (ctx && ed2kToDownload.length > 1) {
    if (specificEd2k !== undefined) {

      if (specificEd2k === -1) {
        ed2kToDownload = thread.ed2kList
      } else {
        ed2kToDownload = [ed2kToDownload[specificEd2k]]
      }

      ctx.editMessageText(`已选择 ${specificEd2k === -1 ? '全部' : '第 ' + (specificEd2k + 1) + ' 个'} ED2K 链接`, {
        reply_markup: undefined
      }).then(() => {
        setTimeout(() => {
          ctx.deleteMessage()
        }, 15000)
      }).catch(() => { })
    } else {
      const keyboard = {
        inline_keyboard: [
          [
            ...thread.ed2kList.map((_, index) => {
              return {
                text: (index + 1).toString(),
                callback_data: `download_video_thread_confirm:${threadId}_${index}`
              }
            }),
          ],
          [{
            text: '下载全部',
            callback_data: `download_video_thread_confirm:${threadId}_-1`
          }]
        ]
      };

      bot.telegram.sendMessage(
        chatId,
        `请选择要下载的 ED2K 链接:\n${thread.ed2kList.map((ed2k, index) => `${index + 1}. ${ed2k}`).join('\n')}`,
        { reply_markup: keyboard }
      ).catch(() => { });
      return {
        success: false,
        error: {
          code: -1
        }
      }
    }
  }

  const downloadResult = await SynologyService.createDownloadStation2EmuleTask(ed2kToDownload)

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

export default downloadEd2kVideoThread

