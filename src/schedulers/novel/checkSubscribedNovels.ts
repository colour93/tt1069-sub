import schedule from "node-schedule";
import { novelPostRepository, novelThreadRepository } from "../../repositories";
import syncNovelThread from "../../tt1069/novel/syncNovelThread";
import bot from "../../telegram";
import ConfigManager from "../../config";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const scheduleCheckSubscribedNovels = () => {
  // 每天 18:00 检查已订阅小说是否有更新
  const job = schedule.scheduleJob("0 18 * * *", async () => {
    const subscribed = await novelThreadRepository.find({
      where: { subscribed: true },
    });

    for (const thread of subscribed) {
      try {
        const beforeCount = await novelPostRepository.count({
          where: { threadId: thread.id },
        });

        await syncNovelThread(thread.id);

        const afterCount = await novelPostRepository.count({
          where: { threadId: thread.id },
        });

        const diff = afterCount - beforeCount;

        if (diff > 0) {
          const chatId = ConfigManager.config.telegramBot.chatId;
          const summary = [
            `#Novel 更新提醒`,
            `标题: ${thread.title}`,
            `新增章节: ${diff}`,
            `总章节: ${afterCount}`,
            ``,
            `原帖: https://www.tt1069.com/bbs/thread-${thread.id}-1-1.html`,
          ].join("\n");

          await bot.telegram.sendMessage(chatId, summary, {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "生成 txt",
                    callback_data: `generate_novel_thread_txt:${thread.id}`,
                  },
                  {
                    text: "取消订阅",
                    callback_data: `novel_thread_unsubscribe_cb:${thread.id}`,
                  },
                ],
              ],
            },
          });
        } else {
          // 无更新则静默
          console.log(`小说 ${thread.id} 无新增章节`);
        }

        console.log(
          `小说 ${thread.id} 同步完成，章节增量 ${diff}，总数 ${afterCount}`
        );
      } catch (error) {
        console.error(`小说 ${thread.id} 同步失败`, error);
      }
    }
  });
  return job;
};

export default scheduleCheckSubscribedNovels;

