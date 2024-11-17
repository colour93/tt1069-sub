import axios from "../axios"
import * as cheerio from "cheerio"
import { Thread } from "../entities/Thread"

const getThreadData = async (threadId: number): Promise<Pick<Thread, 'content' | 'imgList' | 'ed2kList'>> => {
  const resp = await axios.get(`thread-${threadId}-1-1.html`).then(res => res.data)
  const $ = cheerio.load(resp)

  let imgList: string[] = []

  const postElement = $('[id^="postmessage"]').first()
  const imgElements = postElement.find('img')
  const content = postElement.contents().filter(function () {
    return this.nodeType === 3;
  }).text().trim()
  imgElements.each((index, element) => {
    const imgUrl = $(element).attr('src')
    if (imgUrl) imgList.push(imgUrl)
  })
  const ed2kList = content.match(/ed2k:\/\/\|file\|(?:\S+\|)+\//g) || [];

  return { content, imgList, ed2kList }
}

export default getThreadData