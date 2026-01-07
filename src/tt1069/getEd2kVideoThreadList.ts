import axios from "../axios"
import * as cheerio from "cheerio"
import { ThreadEntity } from "../entities/Thread"

/**
 * 获取 TT1069 论坛 ED2K 视频区的帖子列表。
 * 保留分页/时间/数量等裁剪能力，供调度器和命令复用。
 */
const getEd2kVideoThreadList = async ({
  targetId,
  maxPage = 10,
  maxPublishedAt,
  maxCount,
}: {
  targetId?: number
  maxPage?: number
  maxPublishedAt?: Date
  maxCount?: number
}) => {

  const threadList: ThreadEntity[] = []

  let page = 1
  while (true) {
    let threadListByPage = await getThreadListByPage(page)
    if (maxPublishedAt) threadListByPage = threadListByPage.filter((thread) => thread.publishedAt >= maxPublishedAt)
    if (targetId) threadListByPage = threadListByPage.filter((thread) => thread.id > targetId)
    if (maxCount && threadList.length + threadListByPage.length >= maxCount) {
      threadListByPage = threadListByPage.slice(0, maxCount - threadList.length)
      threadList.push(...threadListByPage)
      break
    }
    threadList.push(...threadListByPage)
    if (threadListByPage.length === 0 || (maxPage && page >= maxPage)) break
    page++
  }

  return threadList
}

const getThreadListByPage = async (page: number) => {
  const resp = await axios.get(`forum-85-${page}.html`).then(res => res.data)
  const $ = cheerio.load(resp)

  const tableData: ThreadEntity[] = []

  const table = $('table#threadlisttableid')
  const rows = table.find('[id^="normalthread"]')
  rows.each((index, element) => {
    const rowItem = $(element).find('tr')
    const contentItem = rowItem.find('th.new')
    const createdItem = rowItem.find('td.by')
    const category = contentItem.find('em>a').text()
    const title = contentItem.find('a.s.xst').text()
    const url = contentItem.find('a.s.xst').attr('href')
    const id = Number(url?.split('-')[1])
    const authorName = createdItem.find('cite>a').text()
    const authorUrl = createdItem.find('cite>a').attr('href')
    const authorId = Number(authorUrl?.split('.')[0].split('-')[2])
    const publishedAt = new Date(createdItem.find('em>span').text())
    if (!title || !url || !authorName || !authorUrl || !publishedAt) return
    tableData.push({
      id,
      title,
      publishedAt,
      category,
      author: { id: authorId, name: authorName },
      isPushed: false,
      isDeleted: false,
      isDownloaded: false,
    })
  })
  return tableData
}

export default getEd2kVideoThreadList

