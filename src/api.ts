import express from "express";
import { novelPostRepository, novelThreadRepository } from "./repositories";
import fetchNovelThreadPosts from "./tt1069/novel/fetchNovelThreadPosts";
import syncNovelThread from "./tt1069/novel/syncNovelThread";

const createServer = () => {
  const app = express();
  app.use(express.json());

  const parseThreadIdFromUrl = (url: string): number | null => {
    const match = url.match(/thread-(\d+)-/);
    if (match) return Number(match[1]);
    const matchTid = url.match(/[?&]tid=(\d+)/);
    if (matchTid) return Number(matchTid[1]);
    return null;
  };

  // 健康检查
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // 小说列表
  app.get("/api/novels", async (_req, res) => {
    const threads = await novelThreadRepository.find({
      order: { latestPostAt: "DESC" },
    });

    const withCounts = await Promise.all(
      threads.map(async (t) => {
        const postCount = await novelPostRepository.count({
          where: { threadId: t.id },
        });
        return { ...t, postCount };
      })
    );

    res.json(withCounts);
  });

  // 单个小说详情（包含 posts）
  app.get("/api/novels/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }

    const thread = await novelThreadRepository.findOne({
      where: { id },
    });

    if (!thread) {
      res.status(404).json({ error: "not found" });
      return;
    }

    const posts = await novelPostRepository.find({
      where: { threadId: id },
      order: { publishedAt: "ASC" },
    });

    res.json({ ...thread, posts });
  });

  // 订阅/取消订阅
  app.post("/api/novels/:id/subscribe", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }
    const { subscribed } = req.body as { subscribed: boolean };
    const thread = await novelThreadRepository.findOne({ where: { id } });
    if (!thread) {
      res.status(404).json({ error: "not found" });
      return;
    }
    thread.subscribed = Boolean(subscribed);
    await novelThreadRepository.save(thread);
    res.json({ id, subscribed: thread.subscribed });
  });

  // 通过 threadId 或 url 拉取并写库（返回最新数据）
  app.post("/api/novels/fetch", async (req, res) => {
    const { threadId, url } = req.body as { threadId?: number; url?: string };
    let id = threadId;
    if (!id && url) {
      id = parseThreadIdFromUrl(url) || undefined;
    }
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "invalid threadId/url" });
      return;
    }

    try {
      const payload = await fetchNovelThreadPosts(id, false);
      await syncNovelThread(id);
      const posts = await novelPostRepository.find({
        where: { threadId: id },
        order: { publishedAt: "ASC" },
      });
      const thread = await novelThreadRepository.findOne({ where: { id } });
      res.json({ thread, posts, payload });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // 下载 TXT（基于数据库）
  app.get("/api/novels/:id/txt", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }
    const thread = await novelThreadRepository.findOne({
      where: { id },
      relations: ["author"],
    });
    if (!thread) {
      res.status(404).json({ error: "not found" });
      return;
    }
    const posts = await novelPostRepository.find({
      where: { threadId: id },
      order: { publishedAt: "ASC", id: "ASC" },
    });
    if (!posts.length) {
      res.status(404).json({ error: "no posts" });
      return;
    }
    const content = posts.map((p) => p.content).join("\n\n");
    const filename = `${thread.title} - ${thread.author?.name || "未知"} - ${
      thread.id
    }.txt`;
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(content);
  });

  return app;
};

export const startHttpServer = () => {
  const port = Number(process.env.PORT) || 3000;
  const app = createServer();
  app.listen(port, () => {
    console.log(`HTTP API listening on ${port}`);
  });
};

export default startHttpServer;
