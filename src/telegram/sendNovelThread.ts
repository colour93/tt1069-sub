import bot from ".";
import ConfigManager from "../config";
import { Context } from "telegraf";
import { NovelThreadPayload } from "../tt1069/novel/fetchNovelThreadPosts";
import { Message } from "telegraf/typings/core/types/typegram";

export const sendNovelThreadMessage = async (
  threadId: number,
  ctx: Context,
  onlyBasicInfo = false
) => {
  const chatId =
    ctx?.chat?.id || ctx?.from?.id || ConfigManager.config.telegramBot.chatId;

  const requestMsg = await bot.telegram.sendMessage(
    chatId,
    `正在获取小说帖子 ${threadId} 的数据...`
  );

  return {
    messageId: requestMsg.message_id,
    editMessage: async (thread: NovelThreadPayload) => {
      const msg = getNovelThreadMessage(thread, onlyBasicInfo);
      await bot.telegram.editMessageText(
        ctx?.chat?.id ||
          ctx?.from?.id ||
          ConfigManager.config.telegramBot.chatId,
        requestMsg.message_id,
        undefined,
        msg,
        {
          // 预览包含 Markdown 特殊字符，改为纯文本
          link_preview_options: { is_disabled: true },
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "生成 txt",
                  callback_data: `generate_novel_thread_txt:${thread.id}`,
                },
                {
                  text: "订阅",
                  callback_data: `novel_thread_subscribe_cb:${thread.id}`,
                },
              ],
            ],
          },
        }
      );
    },
  };
};

export const getNovelThreadMessage = (
  thread: NovelThreadPayload,
  onlyBasicInfo = false
) => {
  const totalWords = thread.posts.reduce(
    (acc, post) => acc + (post.content?.length || 0),
    0
  );
  const preview = (thread.posts[0]?.content || "").slice(0, 200);

  let msg = `#Novel ${thread.title}\n`;

  msg += `\n`;

  msg += `ID: ${thread.id}  [论坛原始链接](https://www.tt1069.com/bbs/thread-${thread.id}-1-1.html)\n`;

  msg += `作者: ${thread.author.name}\n`;

  if (!onlyBasicInfo) {
    msg += `楼数: ${thread.posts.length}\n`;
    msg += `字数: ${totalWords}\n`;
  }

  msg += `页数: ${thread.currentTotalPage}\n`;

  msg += `发布时间: ${thread.publishedAt?.toLocaleString()}\n`;

  msg += `最后更新时间: ${thread.posts[
    thread.posts.length - 1
  ].publishedAt?.toLocaleString()}\n`;

  msg += `最后回复时间: ${thread.latestPostAt?.toLocaleString()}\n`;

  msg += `\n预览（前200字）：\n${preview}`;

  return msg;
};

export const sendNovelThread = async (
  thread: NovelThreadPayload,
  saveToDb = true,
  ctx?: Context
) => {
  console.log(`正在推送小说帖子 ${thread.id} 的数据`);

  let message: Message | undefined;

  try {
    message = await bot.telegram.sendMessage(
      ctx?.chat?.id || ctx?.from?.id || ConfigManager.config.telegramBot.chatId,
      getNovelThreadMessage(thread),
      {
        link_preview_options: { is_disabled: true },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "生成 txt",
                callback_data: `generate_novel_thread_txt:${thread.id}`,
              },
              {
                text: "订阅",
                callback_data: `novel_thread_subscribe_cb:${thread.id}`,
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.error(`发送帖子 ${thread.id} 的文本失败`, error);
  }

  // if (saveToDb && message)
  //   await messageRepository.save({
  //     id: message.message_id,
  //     threadId: thread.id,
  //     type: "text",
  //     textMessage: msg,
  //     chatId,
  //   });

  console.log(`小说帖子 ${thread.id} 的数据推送成功`);
};
