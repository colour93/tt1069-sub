import dayjs from "dayjs";
import ConfigManager from "../config";
import { novelPostRepository } from "../repositories";
import bot from "../telegram";

const TELEGRAM_MAX_TEXT = 3800; // 保守留余量，避免 4096 限制

const chunkMessage = (text: string, max = TELEGRAM_MAX_TEXT) => {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + max));
    start += max;
  }
  return chunks;
};

const sendLatestNovelPost = async () => {
  // 找到一个未推送的章节，按发布时间/ID 顺序
  const post = await novelPostRepository
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.thread", "thread")
    .leftJoinAndSelect("thread.author", "author")
    .where("(post.isPushed = :isPushed OR post.isPushed IS NULL)", { isPushed: false })
    .andWhere("thread.subscribed = :subscribed", { subscribed: false })
    .andWhere("thread.firstPushDone = :firstPushDone", { firstPushDone: false })
    .orderBy("post.publishedAt", "ASC")
    .addOrderBy("post.id", "ASC")
    .getOne();

  if (!post || !post.thread) return;

  const chatId = ConfigManager.config.telegramBot.chatId;
  const postCount = await novelPostRepository.count({ where: { threadId: post.thread.id } });

  const header = [
    `#Novel ${post.thread.title || ""}`,
    `作者: ${post.thread.author?.name || "未知"}`,
    `总楼数: ${postCount}`,
    `时间: ${
      post.publishedAt ? dayjs(post.publishedAt).format("YYYY-MM-DD HH:mm") : ""
    }`,
    `原帖: https://www.tt1069.com/bbs/thread-${post.thread.id}-1-1.html`,
    ``,
  ].join("\n");

  const preview = post.content.slice(0, 200);
  const full =
    header +
    preview +
    (post.content.length > 200 ? "\n..." : "");
  const chunks = chunkMessage(full);

  for (const [idx, chunk] of chunks.entries()) {
    const isLast = idx === chunks.length - 1;
    await bot.telegram.sendMessage(chatId, chunk, {
      // 内容可能包含 Markdown 特殊字符，这里不启用 parse_mode 以避免报错
      link_preview_options: { is_disabled: true },
      reply_markup: isLast
        ? {
            inline_keyboard: [
              [
                {
                  text: "生成 txt",
                  callback_data: `generate_novel_thread_txt:${post.thread.id}`,
                },
                {
                  text: "订阅",
                  callback_data: `novel_thread_subscribe_cb:${post.thread.id}`,
                },
              ],
            ],
          }
        : undefined,
    });
    // 若拆分为多条，同一时间发送允许，因为 Telegram 限制是单条长度；整体仍是一个章节
  }

  // 未订阅：仅首推一次，推完后本帖全部章节标记已推送，并标记线程已首推
  await novelPostRepository.update({ threadId: post.thread.id }, { isPushed: true });
  await novelPostRepository.manager
    .getRepository("novel_thread")
    .update({ id: post.thread.id }, { firstPushDone: true });
};

export default sendLatestNovelPost;

