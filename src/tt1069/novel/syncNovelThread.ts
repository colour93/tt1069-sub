import { In } from "typeorm";
import {
  novelAuthorRepository,
  novelPostRepository,
  novelThreadRepository,
} from "../../repositories";
import fetchNovelThreadPosts from "./fetchNovelThreadPosts";

export type SyncNovelThreadResult = {
  addedPosts: number;
  totalPosts: number;
  latestPostAt?: Date | null;
};

/**
 * 拉取并写入小说帖子与章节。
 * - 若作者/帖子不存在则创建
 * - 章节按 id 去重，避免重复写入
 */
export const syncNovelThread = async (
  threadId: number
): Promise<SyncNovelThreadResult> => {
  const payload = await fetchNovelThreadPosts(threadId);

  // upsert author
  let author = await novelAuthorRepository.findOne({
    where: { id: payload.author.id },
  });
  if (!author) {
    author = await novelAuthorRepository.save({
      id: payload.author.id,
      name: payload.author.name,
    });
  }

  // ensure thread exists
  let thread = await novelThreadRepository.findOne({ where: { id: payload.id } });
  if (!thread) {
    thread = await novelThreadRepository.save({
      id: payload.id,
      title: payload.title,
      author,
      subscribed: false,
      publishedAt: payload.publishedAt,
      latestPostAt: payload.latestPostAt,
      lastSyncedAt: null,
      firstPushDone: false,
    });
  } else {
    thread.title = payload.title;
    thread.author = author;
    thread.publishedAt = payload.publishedAt;
    thread.latestPostAt = payload.latestPostAt || thread.latestPostAt || null;
    await novelThreadRepository.save(thread);
  }

  // dedupe posts by id，已存在的保留 isPushed 状态，新内容则更新
  const existingPosts = await novelPostRepository
    .find({
      select: ["id", "isPushed"],
      where: {
        id: In(payload.posts.map((p) => p.id)),
      },
    })
    .then((rows) => new Map(rows.map((r) => [Number(r.id), r.isPushed])));

  const postsToUpsert = payload.posts.map((p) => ({
    id: p.id,
    threadId: payload.id,
    content: p.content,
    floor: p.floor,
    publishedAt: p.publishedAt,
    isPushed: existingPosts.get(p.id) ?? false,
  }));

  const addedPosts = postsToUpsert.filter((p) => !existingPosts.has(p.id)).length;

  if (postsToUpsert.length > 0) {
    await novelPostRepository.upsert(postsToUpsert, ["id"]);
  }

  // 更新 latestPostAt 以 payload 为主，若缺失则按帖子计算
  const latestPostAt =
    payload.latestPostAt ||
    payload.posts.reduce<Date | null>((acc, post) => {
      if (!post.publishedAt) return acc;
      if (!acc) return post.publishedAt;
      return post.publishedAt > acc ? post.publishedAt : acc;
    }, thread.latestPostAt || null) ||
    thread.latestPostAt;

  thread.latestPostAt = latestPostAt || thread.latestPostAt || null;
  thread.lastSyncedAt = new Date();
  await novelThreadRepository.save(thread);

  const totalPosts = await novelPostRepository.count({
    where: { threadId: payload.id },
  });

  return {
    addedPosts,
    totalPosts,
    latestPostAt: thread.latestPostAt,
  };
};

export default syncNovelThread;

