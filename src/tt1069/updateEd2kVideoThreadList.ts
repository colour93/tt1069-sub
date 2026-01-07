import { In } from "typeorm";
import { threadRepository, authorRepository } from "../repositories";
import getThreadData from "./getEd2kVideoThreadData";
import getThreadList from "./getEd2kVideoThreadList";
import { Context } from "telegraf";

/**
 * 更新 ED2K 视频帖子列表并同步入库。
 * 未来扩展小说等其他类型时，可并行添加对应的 update 函数。
 */
export const updateEd2kVideoThreadList = async (
  pages?: number,
  ctx?: Context
) => {
  console.log("开始更新 ED2K 视频帖子");

  let message;

  if (ctx) {
    message = await ctx.reply(`开始更新 ED2K 视频帖子`);
  }

  const latestExistThread = await threadRepository
    .find({
      order: {
        publishedAt: "DESC",
      },
      take: 1,
    })
    .then((res) => (res.length > 0 ? res[0] : null));

  const threads = await getThreadList(
    latestExistThread && !pages
      ? {
          targetId: latestExistThread.id,
        }
      : {
          maxPage: pages || 1,
        }
  );

  const existingThreadIds = await threadRepository
    .find({
      select: ["id"],
      where: {
        id: In(threads.map((t) => t.id)),
      },
    })
    .then((res) => res.map((t) => Number(t.id)));

  console.log(`已存在 ${existingThreadIds.length} 条 ED2K 视频帖子`);

  const newThreads = threads.filter((t) => !existingThreadIds.includes(t.id));

  if (message && ctx) {
    await ctx.telegram.editMessageText(
      message.chat.id,
      message.message_id,
      undefined,
      `获取到 ${newThreads.length} 条 ED2K 视频帖子`
    );
  }

  console.log(`获取到 ${newThreads.length} 条 ED2K 视频帖子`);

  for (const [index, thread] of newThreads.entries()) {
    console.log(`正在获取第 ${index + 1} 条帖子 ${thread.id} 的数据`);
    const threadData = await getThreadData(thread.id);
    if (thread.author) {
      let author = await authorRepository.findOne({
        where: {
          id: thread.author.id,
        },
      });
      if (!author) {
        author = await authorRepository.save(thread.author);
      }
    }

    const newThread = {
      ...threadData,
      ...thread,
    };

    await threadRepository.upsert(newThread, ["id"]);
  }

  if (message && ctx) {
    await ctx.telegram.editMessageText(
      message.chat.id,
      message.message_id,
      undefined,
      "更新 ED2K 视频帖子完成"
    );
  }

  console.log("更新 ED2K 视频帖子完成");
};
