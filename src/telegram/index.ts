import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import ConfigManager from "../config";
import { HttpsProxyAgent } from "https-proxy-agent";

const bot = new Telegraf(ConfigManager.config.telegramBot.token, ConfigManager.config.telegramBot.proxy ? {
  telegram: {
    agent: new HttpsProxyAgent(ConfigManager.config.telegramBot.proxy)
  }
} : undefined)

bot.on(message('text'), async (ctx) => {
  if (ctx.message.text === '/id') {
    ctx.reply(`uid: ${ctx.message.from.id}\n gid: ${ctx.message.chat.id}`)
  }
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

export default bot