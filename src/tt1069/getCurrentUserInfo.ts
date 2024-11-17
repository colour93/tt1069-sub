import axios from "../axios"
import * as cheerio from "cheerio"

interface UserData {
  id: number
  name: string
}

const getCurrentUserInfo = async (): Promise<UserData> => {
  const resp = await axios.get('').then(res => res.data)
  const $ = cheerio.load(resp)

  const userInfoElement = $('.vwmy>a')
  const href = userInfoElement.attr('href')
  if (!href) throw new Error('用户信息为空')
  const id = Number(href?.split('.')[0].split('-')?.[2])
  const name = userInfoElement.text()
  return { id, name }
}

export default getCurrentUserInfo