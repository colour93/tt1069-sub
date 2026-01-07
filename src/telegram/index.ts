import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import ConfigManager from "../config";
import { HttpsProxyAgent } from "https-proxy-agent";
import downloadEd2kVideoThread from "./downloadEd2kVideoThread";
import deleteThread from "./deleteThread";
import getStatus from "./getStatus";
import getEd2kVideoThread from "./getEd2kVideoThread";
import sendEd2kVideoThread from "./sendEd2kVideoThread";
import { updateEd2kVideoThreadList } from "../tt1069/updateEd2kVideoThreadList";
import markDownloadedEd2kVideoThread from "./markDownloadedEd2kVideoThread";
import { novelThreadRepository } from "../repositories";
import syncNovelThread from "../tt1069/novel/syncNovelThread";
import fetchNovelThreadPosts from "../tt1069/novel/fetchNovelThreadPosts";
import { sendNovelThreadMessage } from "./sendNovelThread";
import { generateNovelThreadTxt } from "./generateNovelThreadTxt";
import { updateNovelThreadList } from "../tt1069/novel/updateNovelThreadList";

const bot = new Telegraf(
  ConfigManager.config.telegramBot.token,
  ConfigManager.config.telegramBot.proxy
    ? {
        telegram: {
          agent: new HttpsProxyAgent(ConfigManager.config.telegramBot.proxy),
        },
      }
    : undefined
);

bot.telegram.setMyCommands([
  { command: "id", description: "获取用户及群组 ID" },
  { command: "status", description: "获取所有帖子状态" },
  {
    command: "video_thread",
    description: "获取 ED2K 视频帖子信息 /video_thread <id>",
  },
  {
    command: "update_video_threads",
    description: "更新多页 ED2K 视频帖子列表 /update_video_threads <page>",
  },
  { command: "video_thread_status", description: "获取帖子状态" },
  {
    command: "novel_thread",
    description: "获取小说帖子信息 /novel_thread <id>",
  },
  {
    command: "update_novel_threads",
    description: "更新多页小说帖子列表 /update_novel_threads <page>",
  },
  { command: "novel_thread_status", description: "获取小说帖子状态" },
  {
    command: "novel_thread_subscribe",
    description: "订阅小说帖子 /novel_thread_subscribe <id>",
  },
  {
    command: "novel_thread_unsubscribe",
    description: "取消订阅小说帖子 /novel_thread_unsubscribe <id>",
  },
  {
    command: "novel_thread_sync",
    description: "手动同步小说帖子 /novel_thread_sync <id>",
  },
]);

bot.on(message("text"), async (ctx) => {
  if (ctx.message.text === "/id") {
    ctx.reply(`uid: ${ctx.message.from.id}\n gid: ${ctx.message.chat.id}`);
  }
  if (ctx.message.text === "/video_thread") {
    const status = await getStatus();
    ctx.reply(
      `ED2K 视频帖子总数: ${status.thread.total}\n有效帖子数: ${
        status.thread.valid
      }\n已推送帖子数: ${
        status.thread.pushed
      }\n最新帖子发布时间: ${status.thread.latestPublishedAt?.toLocaleString()}\n作者总数: ${
        status.author.total
      }`
    );
  }
  const novelThreadMatch = ctx.message.text.match(
    /(?:^\/novel_thread\s+|https:\/\/www\.tt1069\.com\/bbs\/(?:thread-|forum\.php\?.*?tid=))(\d+)/
  );
  const novelThreadId = novelThreadMatch?.[1];
  if (novelThreadId) {
    console.log("开始获取小说帖子", novelThreadId);
    // 拉取并写库
    const threadPayload = await fetchNovelThreadPosts(Number(novelThreadId), false);
    await syncNovelThread(Number(novelThreadId));

    const { editMessage } = await sendNovelThreadMessage(
      Number(novelThreadId),
      ctx,
      true
    );
    if (threadPayload) {
      await editMessage(threadPayload);
    } else {
      ctx.reply(`帖子不存在`);
    }
    // 已处理小说帖子，避免继续匹配视频帖子
    return;
  }

  const videoThreadMatch = ctx.message.text.match(
    /(?:^\/video_thread\s+|https:\/\/www\.tt1069\.com\/bbs\/(?:thread-|forum\.php\?.*?tid=))(\d+)/
  );
  const videoThreadId = videoThreadMatch?.[1];
  if (videoThreadId) {
    const thread = await getEd2kVideoThread(Number(videoThreadId));
    if (thread) {
      sendEd2kVideoThread(thread, true, ctx);
    } else {
      ctx.reply(`帖子不存在`);
    }
  }

  const updateVideoThreadsMatch = ctx.message.text.match(
    /\/update_video_threads (\d+)/
  );
  if (updateVideoThreadsMatch) {
    const page = Number(updateVideoThreadsMatch[1]);
    updateEd2kVideoThreadList(page, ctx);
  }

  const novelThreadSubscribeMatch = ctx.message.text.match(
    /\/novel_thread_subscribe (\d+)/
  );
  if (novelThreadSubscribeMatch) {
    const threadId = Number(novelThreadSubscribeMatch[1]);
    if (isNaN(threadId)) {
      ctx.reply("帖子 ID 无效");
      return;
    }
    await novelThreadRepository.upsert(
      {
        id: threadId,
        title: "",
        subscribed: true,
      },
      ["id"]
    );
    ctx.reply(`小说帖子 ${threadId} 已订阅，后续每日 08:00 自动检查更新`);
  }

  const novelThreadUnsubscribeMatch = ctx.message.text.match(
    /\/novel_thread_unsubscribe (\d+)/
  );
  if (novelThreadUnsubscribeMatch) {
    const threadId = Number(novelThreadUnsubscribeMatch[1]);
    if (isNaN(threadId)) {
      ctx.reply("帖子 ID 无效");
      return;
    }
    await novelThreadRepository.update({ id: threadId }, { subscribed: false });
    ctx.reply(`小说帖子 ${threadId} 已取消订阅`);
  }

  const novelThreadSyncMatch = ctx.message.text.match(
    /\/novel_thread_sync (\d+)/
  );
  if (novelThreadSyncMatch) {
    const threadId = Number(novelThreadSyncMatch[1]);
    if (isNaN(threadId)) {
      ctx.reply("帖子 ID 无效");
      return;
    }
    try {
      const result = await syncNovelThread(threadId);
      ctx.reply(
        `同步完成，新增章节 ${result.addedPosts}，总章节 ${result.totalPosts}`
      );
    } catch (error) {
      console.error(error);
      ctx.reply(`同步失败：${(error as Error).message}`);
    }
  }

  const updateNovelThreadsMatch = ctx.message.text.match(
    /\/update_novel_threads (\d+)/
  );
  if (updateNovelThreadsMatch) {
    const page = Number(updateNovelThreadsMatch[1]);
    updateNovelThreadList(page, ctx);
  }
});

bot.action(/^download_video_thread:(\d+)$/, async (ctx) => {
  try {
    const threadId = Number(ctx.match[1]);
    if (isNaN(threadId)) {
      await ctx.answerCbQuery("帖子 ID 不正确").catch(() => {});

      return;
    }
    const result = await downloadEd2kVideoThread(threadId, ctx);
    if (result && result.success) {
      await ctx.answerCbQuery("开始下载").catch(() => {});
    } else if (result && result.error.code === -1) {
      await ctx.answerCbQuery("已发送 ED2K 选择请求").catch(() => {});
    } else {
      await ctx
        .answerCbQuery(
          result ? `下载失败，错误码：${result.error.code}` : "下载失败"
        )
        .catch(() => {});
    }
  } catch (error) {
    console.error(error);
  }
});

bot.action(/^delete_video_thread:(\d+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery("已删除");

    const threadId = Number(ctx.match[1]);
    if (isNaN(threadId)) {
      await ctx.answerCbQuery("帖子 ID 不正确");
      return;
    }
    await deleteThread(threadId, ctx);
  } catch (error) {
    console.error(error);
  }
});

bot.action(/^download_video_thread_confirm:(\d+)_(.*)$/, async (ctx) => {
  try {
    const threadId = Number(ctx.match[1]);
    if (isNaN(threadId)) {
      await ctx.answerCbQuery("帖子 ID 不正确").catch(() => {});
      return;
    }
    const index = Number(ctx.match[2]);
    if (isNaN(index)) {
      await ctx.answerCbQuery("链接序号不正确").catch(() => {});
      return;
    }
    const result = await downloadEd2kVideoThread(threadId, ctx, index);
    if (result && result.success) {
      await ctx.answerCbQuery("开始下载").catch(() => {});
    } else {
      await ctx
        .answerCbQuery(
          result ? `下载失败，错误码：${result.error.code}` : "下载失败"
        )
        .catch(() => {});
    }
  } catch (error) {
    console.error(error);
  }
});

bot.action(/^download_video_thread_mark:(\d+)$/, async (ctx) => {
  try {
    const threadId = Number(ctx.match[1]);
    if (isNaN(threadId)) {
      await ctx.answerCbQuery("帖子 ID 不正确").catch(() => {});

      return;
    }
    await markDownloadedEd2kVideoThread(threadId, ctx);
    await ctx.answerCbQuery("已标记").catch(() => {});
  } catch (error) {
    console.error(error);
  }
});

bot.action(/^generate_novel_thread_txt:(\d+)$/, async (ctx) => {
  try {
    const threadId = Number(ctx.match[1]);
    if (isNaN(threadId)) {
      await ctx.answerCbQuery("帖子 ID 不正确").catch(() => {});
      return;
    }
    await ctx.answerCbQuery("开始生成").catch(() => {});
    await ctx.sendDocument(await generateNovelThreadTxt(threadId));
    await ctx.answerCbQuery("生成完成").catch(() => {});
  } catch (error) {
    console.error(error);
  }
});

bot.action(/^novel_thread_subscribe_cb:(\d+)$/, async (ctx) => {
  try {
    const threadId = Number(ctx.match[1]);
    if (isNaN(threadId)) {
      await ctx.answerCbQuery("帖子 ID 不正确").catch(() => {});
      return;
    }
    await novelThreadRepository.upsert(
      {
        id: threadId,
        title: "",
        subscribed: true,
      },
      ["id"]
    );
    await ctx.answerCbQuery("已订阅").catch(() => {});
    await ctx.reply(`小说帖子 ${threadId} 已订阅，后续每日 08:00 自动检查更新`);
  } catch (error) {
    console.error(error);
  }
});

bot.action(/^novel_thread_unsubscribe_cb:(\d+)$/, async (ctx) => {
  try {
    const threadId = Number(ctx.match[1]);
    if (isNaN(threadId)) {
      await ctx.answerCbQuery("帖子 ID 不正确").catch(() => {});
      return;
    }
    await novelThreadRepository.update({ id: threadId }, { subscribed: false });
    await ctx.answerCbQuery("已取消订阅").catch(() => {});
    await ctx.reply(`小说帖子 ${threadId} 已取消订阅`);
  } catch (error) {
    console.error(error);
  }
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default bot;
