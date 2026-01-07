import { In } from "typeorm";
import {
  novelAuthorRepository,
  novelThreadRepository,
} from "../../repositories";
import getNovelThreadList from "./getNovelThreadList";
import { Context } from "telegraf";
import syncNovelThread from "./syncNovelThread";

/**
 * 获取小说区最新帖子列表并入库（仅基本信息，不抓全文）。
 */
export const updateNovelThreadList = async (pages?: number, ctx?: Context) => {
  console.log("开始更新小说帖子列表");

  let message;
  if (ctx) {
    message = await ctx.reply(`开始更新小说帖子列表`);
  }

  const latestExistThread = await novelThreadRepository
    .find({
      order: {
        id: "DESC",
      },
      take: 1,
    })
    .then((res) => (res.length > 0 ? res[0] : null));

  const threads = await getNovelThreadList(
    latestExistThread && !pages
      ? {
          targetId: latestExistThread.id,
        }
      : {
          maxPage: pages || 1,
        }
  );

  const existingThreadIds = await novelThreadRepository
    .find({
      select: ["id", "latestPostAt", "firstPushDone"],
      where: {
        id: In(threads.map((t) => t.id)),
      },
    })
    .then((res) =>
      res.reduce<Record<number, { latestPostAt: Date | null; firstPushDone: boolean }>>(
        (acc, t) => {
          acc[Number(t.id)] = {
            latestPostAt: t.latestPostAt || null,
            firstPushDone: t.firstPushDone,
          };
          return acc;
        },
        {}
      )
    );

  console.log(`已存在 ${Object.keys(existingThreadIds).length} 条小说帖子`);

  const newThreads = threads.filter((t) => existingThreadIds[t.id] === undefined);
  const updatedThreads = threads.filter((t) => {
    const existedLatest = existingThreadIds[t.id]?.latestPostAt;
    return existedLatest !== undefined && t.latestPostAt && (!existedLatest || t.latestPostAt > existedLatest);
  });

  const toSyncThreads = [...newThreads, ...updatedThreads];

  if (message && ctx) {
    await ctx.telegram.editMessageText(
      message.chat.id,
      message.message_id,
      undefined,
      `获取到 ${newThreads.length} 条新增帖子，${updatedThreads.length} 条疑似更新帖子`
    );
  }

  console.log(`获取到 ${newThreads.length} 条新增帖子，${updatedThreads.length} 条疑似更新帖子`);

  // 先更新/插入列表基本信息
  for (const thread of threads) {
    if (thread.author) {
      let author = await novelAuthorRepository.findOne({
        where: {
          id: thread.author.id,
        },
      });
      if (!author) {
        author = await novelAuthorRepository.save(thread.author);
      }
      thread.author = author;
    }

    await novelThreadRepository.upsert(
      {
        id: thread.id,
        title: thread.title,
        author: thread.author,
        subscribed: false,
        publishedAt: thread.publishedAt,
        latestPostAt: thread.latestPostAt,
        lastSyncedAt: null,
        firstPushDone: existingThreadIds[thread.id]?.firstPushDone ?? false,
      },
      ["id"]
    );
  }

  // 对新增或 latestPostAt 变更的线程拉取全文并入库
  for (const [index, thread] of toSyncThreads.entries()) {
    console.log(`同步第 ${index + 1}/${toSyncThreads.length} 条小说 ${thread.id}`);
    try {
      await syncNovelThread(thread.id);
    } catch (error) {
      console.error(`同步小说 ${thread.id} 失败`, error);
    }
  }

  if (message && ctx) {
    await ctx.telegram.editMessageText(
      message.chat.id,
      message.message_id,
      undefined,
      "更新小说帖子完成"
    );
  }

  console.log("更新小说帖子完成");
};