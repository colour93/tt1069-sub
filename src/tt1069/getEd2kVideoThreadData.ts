import axios from "../axios"
import * as cheerio from "cheerio"
import { ed2kRegex } from "../utils"

/**
 * 获取单个 ED2K 视频帖子的完整信息。
 */
const getEd2kVideoThreadData = async (threadId: number) => {
  const resp = await axios.get(`thread-${threadId}-1-1.html`).then(res => res.data)
  const $ = cheerio.load(resp)

  let imgList: string[] = []

  const titleElement = $('#postlist > table').first().find('.ts')

  const title = titleElement.find('#thread_subject').text()
  const category = titleElement.find('a').text().replace(/[\[\]]/g, '')

  const firstPostElement = $('div[id^="post_"]')

  const authorElement = firstPostElement.find('.pls .authi a')
  const authorId = Number(authorElement.attr('href')?.split('.')[0].split('-')[2])
  const authorName = authorElement.text()

  const publishedAtString = firstPostElement.find('.plc .authi em').text()
  const publishedAt = new Date(publishedAtString)

  const postElement = $('[id^="postmessage"]').first()
  const imgElements = postElement.find('img')
  const content = postElement.contents().filter(function () {
    return this.nodeType === 3;
  }).text().trim()
  imgElements.each((index, element) => {
    const imgUrl = $(element).attr('src')
    if (imgUrl) imgList.push(imgUrl)
  })
  const ed2kList = content.match(ed2kRegex) || [];

  return {
    id: threadId,
    title,
    category,
    author: { id: authorId, name: authorName },
    publishedAt,
    content,
    imgList,
    ed2kList,
  }
}

export default getEd2kVideoThreadData

