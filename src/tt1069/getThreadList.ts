import axios from "../axios"
import * as cheerio from "cheerio"
import { Thread } from "../entities/Thread"

const getThreadList = async ({
  targetId,
  maxPage = 10,
  maxPublishedAt,
}: {
  targetId?: number
  maxPage?: number
  maxPublishedAt?: Date
}) => {

  const threadList: Thread[] = []

  let page = 1
  while (true) {
    let threadListByPage = await getThreadListByPage(page)
    if (maxPublishedAt) threadListByPage = threadListByPage.filter((thread) => thread.publishedAt >= maxPublishedAt)
    if (targetId) threadListByPage = threadListByPage.filter((thread) => thread.id > targetId)
    threadList.push(...threadListByPage)
    if (threadListByPage.length === 0 || (maxPage && page >= maxPage)) break
    page++
  }

  return threadList
}

const getThreadListByPage = async (page: number) => {
  const resp = await axios.get(`forum-85-${page}.html`).then(res => res.data)
  const $ = cheerio.load(resp)

  const tableData: Thread[] = []

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
    tableData.push({ id, title, publishedAt, category, author: { id: authorId, name: authorName } })
  })
  return tableData
}

export default getThreadList