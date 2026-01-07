import axios from "../../axios";
import * as cheerio from "cheerio";
import * as OpenCC from "opencc-js";

export type NovelPostPayload = {
  id: number;
  threadId: number;
  floor?: number | null;
  content: string;
  publishedAt?: Date | null;
};

export type NovelThreadPayload = {
  id: number;
  title: string;
  author: {
    id: number;
    name: string;
  };
  posts: NovelPostPayload[];
  currentTotalPage: number;
  publishedAt: Date;
  latestPostAt: Date;
};

const converter = OpenCC.Converter({ from: "tw", to: "cn" });

const fetchNovelThreaLatestPostAt = async (
  _threadId: number
): Promise<Date> => {
  const resp = await axios
    .get(`forum.php?mod=viewthread&tid=${_threadId}&page=1&ordertype=1`)
    .then((res) => res.data);
  const $ = cheerio.load(resp);
  const postElements = $('#postlist > div[id^="post_"]');
  const lastPostExceptFirst = postElements[1] || postElements[0];
  const publishedAtText = $(lastPostExceptFirst).find(".authi > em").text();
  const publishedAt = new Date(publishedAtText.replace("發表於 ", ""));
  return publishedAt;
};

const fetchNovelThreadPostsPage = async (
  _threadId: number,
  _authorId: number,
  _page: number
): Promise<{
  totalPage: number;
  posts: NovelPostPayload[];
}> => {
  const resp = await axios
    .get(
      `forum.php?mod=viewthread&tid=${_threadId}&authorid=${_authorId}&page=${_page}`
    )
    .then((res) => res.data);
  const $ = cheerio.load(resp);
  const postElements = $('#postlist > div[id^="post_"]');

  const posts: NovelPostPayload[] = [];

  postElements.each((_index, element) => {
    const id = Number($(element).attr("id")?.split("_")[1]);
    const postFloor = Number(
      $(element)
        .find("table > tbody > tr > td.plc > .pi > strong > a > em")
        .text()
    );

    // 發表於 2025-8-9 02:37
    const publishedAtText = $(element).find(".authi > em").text();
    const publishedAt = new Date(publishedAtText.replace("發表於 ", ""));
    const contentElement = $(element).find("td.t_f");

    // 过滤混淆内容（常见为行内 display:none 或干扰类名）
    contentElement.find("[style*='display:none']").remove();
    contentElement.find("[style*='display: none']").remove();
    contentElement.find(".pstatus").remove();
    contentElement.find(".quote").remove();
    contentElement.find(".jammer").remove();

    // 繁转简
    const content = converter(contentElement.text());

    posts.push({
      id,
      floor: postFloor,
      content,
      threadId: _threadId,
      publishedAt,
    });
  });

  const totalPagesText = $("#pgt > div > div > label > span").text() || "";
  const totalPagesMatch = /\d+/g.exec(totalPagesText);
  const totalPage = totalPagesMatch ? Number(totalPagesMatch[0]) : 1;

  return {
    totalPage,
    posts,
  };
};

const fetchNovelThreadPosts = async (
  _threadId: number,
  onlyBasicInfo = false
): Promise<NovelThreadPayload> => {
  // 先获取帖子标准信息
  const baseInfoResp = await axios
    .get(`thread-${_threadId}-1-1.html`)
    .then((res) => res.data);
  const $1 = cheerio.load(baseInfoResp);

  const titleElement = $1("#postlist > table").first().find(".ts");
  const title = titleElement.find("#thread_subject").text();

  const firstPostElement = $1('div[id^="post_"]');

  const authorElement = firstPostElement.find(".pls .authi a").first();
  const authorId = Number(
    authorElement.attr("href")?.split(".")[0].split("-")[2]
  );
  const authorName = authorElement.text();

  const posts: NovelPostPayload[] = [];

  // 通过 authorId 指定仅作者模式
  // 先获取总页数
  const { totalPage, posts: firstPagePosts } = await fetchNovelThreadPostsPage(
    _threadId,
    authorId,
    1
  );
  posts.push(...firstPagePosts);

  const latestPostAt = await fetchNovelThreaLatestPostAt(_threadId);

  // 正式进入帖子列表抓取
  console.log(
    `title=${title}, authorId=${authorId}, authorName=${authorName}, totalPage=${totalPage}, latestPostAt=${latestPostAt}`
  );

  if (totalPage > 1 && !onlyBasicInfo) {
    for (let page = 2; page <= totalPage; page++) {
      const { posts: pagePosts } = await fetchNovelThreadPostsPage(
        _threadId,
        authorId,
        page
      );
      posts.push(...pagePosts);
    }
  }
  return {
    id: _threadId,
    title,
    author: { id: authorId, name: authorName },
    posts,
    currentTotalPage: totalPage,
    publishedAt: firstPagePosts[0].publishedAt!,
    latestPostAt,
  };
};

export default fetchNovelThreadPosts;
