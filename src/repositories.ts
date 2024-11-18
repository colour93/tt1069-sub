import AppDataSource from "./dataSource"
import { AuthorEntity } from "./entities/Author"
import { MessageEntity } from "./entities/Message"
import { ThreadEntity } from "./entities/Thread"

export const threadRepository = AppDataSource.getRepository(ThreadEntity)
export const authorRepository = AppDataSource.getRepository(AuthorEntity)
export const messageRepository = AppDataSource.getRepository(MessageEntity)