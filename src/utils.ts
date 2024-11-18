export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const ed2kRegex = /ed2k:\/\/\|file\|(.+?)\|(\d+?)\|(.+?)\|/g

export const ed2kRegexMd = /\n?\`ed2k:\/\/\|file\|(.+?)\|(\d+?)\|(.+?)\|\`\n?/g
