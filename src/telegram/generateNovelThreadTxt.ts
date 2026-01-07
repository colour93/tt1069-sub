import { InputFile } from "telegraf/typings/core/types/typegram";
import { novelPostRepository, novelThreadRepository } from "../repositories";
import dayjs from "dayjs";

export const generateNovelThreadTxt = async (
  threadId: number
): Promise<InputFile> => {
  const thread = await novelThreadRepository.findOne({
    where: { id: threadId },
    relations: ["author"],
  });
  if (!thread) {
    throw new Error("数据库中未找到该小说帖子，请先同步后再生成");
  }

  const posts = await novelPostRepository.find({
    where: { threadId },
    order: { publishedAt: "ASC", id: "ASC" },
  });

  if (!posts.length) {
    throw new Error("数据库中暂无章节，请先同步后再生成");
  }

  const content = posts.map((post) => post.content).join("\n\n");
  const latestDate = posts[posts.length - 1].publishedAt
    ? dayjs(posts[posts.length - 1].publishedAt).format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");
  const filename = `${thread.title} - ${thread.author?.name || "未知"} - ${
    thread.id
  } - ${latestDate}.txt`;
  return {
    source: Buffer.from(content, "utf-8"),
    filename,
  };
};
