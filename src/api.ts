import express, { Request } from "express";
import path from "path";
import { NovelThreadEntity } from "./entities/NovelThread";
import { novelPostRepository, novelThreadRepository } from "./repositories";
import fetchNovelThreadPosts from "./tt1069/novel/fetchNovelThreadPosts";
import syncNovelThread from "./tt1069/novel/syncNovelThread";

const createServer = () => {
  const app = express();
  app.use(express.json());

  const staticRoot = path.resolve(__dirname, "../web/dist");
  app.use(express.static(staticRoot));

  const pickQueryString = (value: unknown): string | undefined => {
    if (Array.isArray(value)) return value[0];
    if (typeof value === "string") return value;
    return undefined;
  };

  const parsePagination = (
    req: Request,
    {
      defaultPage = 1,
      defaultPageSize = 20,
      maxPageSize = 100,
    }: { defaultPage?: number; defaultPageSize?: number; maxPageSize?: number } = {}
  ) => {
    const page = Math.max(
      1,
      Number(pickQueryString(req.query.page)) || defaultPage
    );
    const requestedSize = Number(pickQueryString(req.query.pageSize));
    const pageSize = Math.max(
      1,
      Math.min(
        Number.isFinite(requestedSize) ? Number(requestedSize) : defaultPageSize,
        maxPageSize
      )
    );

    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  };

  type NovelThreadWithPostCount = NovelThreadEntity & { postCount: number };

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
    const { page, pageSize, skip, take } = parsePagination(_req);
    const keyword = pickQueryString(_req.query.keyword)?.trim().toLowerCase();
    const subscribedRaw = pickQueryString(_req.query.subscribed);
    const sortField =
      pickQueryString(_req.query.sort) === "publishedAt"
        ? "thread.publishedAt"
        : "thread.latestPostAt";

    const qb = novelThreadRepository
      .createQueryBuilder("thread")
      .leftJoinAndSelect("thread.author", "author")
      .loadRelationCountAndMap("thread.postCount", "thread.posts")
      .orderBy(`${sortField}`, "DESC", "NULLS LAST")
      .addOrderBy("thread.id", "DESC")
      .skip(skip)
      .take(take);

    if (keyword) {
      qb.andWhere(
        "(LOWER(thread.title) LIKE :kw OR LOWER(author.name) LIKE :kw)",
        { kw: `%${keyword}%` }
      );
    }

    if (typeof subscribedRaw === "string") {
      const normalized = subscribedRaw.toLowerCase();
      if (["true", "false"].includes(normalized)) {
        qb.andWhere("thread.subscribed = :subscribed", {
          subscribed: normalized === "true",
        });
      }
    }

    const [threads, total] = await qb.getManyAndCount();

    res.json({
      data: threads as NovelThreadWithPostCount[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
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
      relations: ["author"],
    });

    if (!thread) {
      res.status(404).json({ error: "not found" });
      return;
    }

    const postTotal = await novelPostRepository.count({ where: { threadId: id } });
    const posts = await novelPostRepository.find({
      where: { threadId: id },
      order: { publishedAt: "ASC" },
    });

    res.json({ ...thread, posts, postCount: postTotal });
  });

  // 单个小说 posts 分页
  app.get("/api/novels/:id/posts", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "invalid id" });
      return;
    }

    const { page, pageSize, skip, take } = parsePagination(req, {
      defaultPageSize: 50,
      maxPageSize: 200,
    });

    const orderDirection =
      pickQueryString(req.query.order)?.toLowerCase() === "desc"
        ? "DESC"
        : "ASC";

    const [posts, total] = await novelPostRepository.findAndCount({
      where: { threadId: id },
      order: { publishedAt: orderDirection, id: orderDirection },
      skip,
      take,
    });

    res.json({
      data: posts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
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

  // 前端静态资源与 SPA 回退
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.sendFile(path.join(staticRoot, "index.html"));
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
