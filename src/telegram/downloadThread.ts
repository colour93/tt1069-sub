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

  let ed2kToDownload = thread.ed2kList;

  if (ctx && ed2kToDownload.length > 1) {
    const keyboard = {
      inline_keyboard: [
        [
          ...thread.ed2kList.map((_, index) => {
            return {
              text: (index + 1).toString(),
              callback_data: `download-confirm_${threadId}_${index}`
            }
          }),
        ],
        [{
          text: '下载全部',
          callback_data: `download-confirm_${threadId}_all`
        }]
      ]
    };

    const msg = await bot.telegram.sendMessage(
      chatId,
      `请在 30 秒内选择要下载的 ED2K 链接:\n${thread.ed2kList.map((ed2k, index) => `${index + 1}. ${ed2k}`).join('\n')}`,
      { reply_markup: keyboard }
    );

    try {
      const response = await Promise.race([
        new Promise<string>((resolve) => {
          bot.action(new RegExp(`download-confirm_${threadId}_.*`), (ctx) => {
            ctx.answerCbQuery().catch(() => { });
            resolve(ctx.match[0].split('_')[2]);
          });
        }),
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('timeout'), 30000)
        )
      ]);

      if (response === 'timeout') {
        await bot.telegram.editMessageText(
          chatId,
          msg.message_id,
          undefined,
          '已超时，将下载全部链接'
        );
      } else if (response === 'all') {
        ed2kToDownload = thread.ed2kList;
        await bot.telegram.editMessageText(
          chatId,
          msg.message_id,
          undefined,
          '将下载全部链接'
        );
      } else {
        const index = parseInt(response);
        if (index >= 0 && index < thread.ed2kList.length) {
          ed2kToDownload = [thread.ed2kList[index]];
          await bot.telegram.editMessageText(
            chatId,
            msg.message_id,
            undefined,
            `将下载第 ${index + 1} 个链接`
          );
        }
      }
      setTimeout(() => {
        bot.telegram.deleteMessage(chatId, msg.message_id);
      }, 15000);
    } catch (error) {
      console.error('获取用户选择失败:', error);
      const msg = await bot.telegram.sendMessage(chatId, '获取选择失败,将下载全部链接');
      setTimeout(() => {
        bot.telegram.deleteMessage(chatId, msg.message_id);
      }, 15000);
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

export default downloadThread