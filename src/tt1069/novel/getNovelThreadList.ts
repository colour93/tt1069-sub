import axios from "../../axios";
import * as cheerio from "cheerio";
import { NovelThreadEntity } from "../../entities/NovelThread";

/**
 * 抓取小说区（fid=5）的帖子列表。
 * 支持按 targetId / maxPage / maxCount / maxPublishedAt 过滤。
 */
const getNovelThreadList = async ({
  targetId,
  maxPage = 10,
  maxPublishedAt,
  maxCount,
}: {
  targetId?: number;
  maxPage?: number;
  maxPublishedAt?: Date;
  maxCount?: number;
}) => {
  const threadList: NovelThreadEntity[] = [];

  let page = 1;
  while (true) {
    let threadListByPage = await getThreadListByPage(page);
    if (maxPublishedAt)
      threadListByPage = threadListByPage.filter(
        (thread) => thread.latestPostAt && thread.latestPostAt >= maxPublishedAt
      );
    if (targetId)
      threadListByPage = threadListByPage.filter(
        (thread) => thread.id > targetId
      );
    if (maxCount && threadList.length + threadListByPage.length >= maxCount) {
      threadListByPage = threadListByPage.slice(
        0,
        maxCount - threadList.length
      );
      threadList.push(...threadListByPage);
      break;
    }
    threadList.push(...threadListByPage);
    if (threadListByPage.length === 0 || (maxPage && page >= maxPage)) break;
    page++;
  }

  return threadList;
};

const getThreadListByPage = async (page: number) => {
  // fid=5 为小说区
  const resp = await axios.get(`forum-5-${page}.html`).then((res) => res.data);
  const $ = cheerio.load(resp);

  const tableData: NovelThreadEntity[] = [];

  const table = $("table#threadlisttableid");
  const rows = table.find('[id^="normalthread"]');
  rows.each((_index, element) => {
    const rowItem = $(element).find("tr");
    const contentItem = rowItem.find("th.new");
    const createdItem = rowItem.find("td.by");
    const title = contentItem.find("a.s.xst").text();
    const url = contentItem.find("a.s.xst").attr("href");
    const id = Number(url?.split("-")[1]);
    const authorName = createdItem.find("cite>a").text();
    const authorUrl = createdItem.find("cite>a").attr("href");
    const authorId = Number(authorUrl?.split(".")[0].split("-")[2]);
    const publishedAtText = rowItem
      .find("td:nth-child(3) > em > span > span")
      .text();
    const publishedAt = publishedAtText ? new Date(publishedAtText) : undefined;
    const latestPostAtText = rowItem.find("td:nth-child(5) > em > a").text();
    const latestPostAt = latestPostAtText
      ? new Date(latestPostAtText)
      : undefined;
    if (!title || !url || !authorName || !authorUrl) return;
    tableData.push({
      id,
      title,
      author: { id: authorId, name: authorName },
      subscribed: false,
      publishedAt: publishedAt || undefined,
      latestPostAt: latestPostAt || undefined,
      lastSyncedAt: null,
      firstPushDone: false,
      posts: [],
    } as NovelThreadEntity);
  });
  return tableData;
};

export default getNovelThreadList;
