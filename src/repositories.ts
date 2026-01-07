import AppDataSource from "./dataSource"
import { AuthorEntity } from "./entities/Author"
import { MessageEntity } from "./entities/Message"
import { ThreadEntity } from "./entities/Thread"
import { NovelAuthorEntity } from "./entities/NovelAuthor"
import { NovelThreadEntity } from "./entities/NovelThread"
import { NovelPostEntity } from "./entities/NovelPost"

export const threadRepository = AppDataSource.getRepository(ThreadEntity)
export const authorRepository = AppDataSource.getRepository(AuthorEntity)
export const messageRepository = AppDataSource.getRepository(MessageEntity)
export const novelAuthorRepository = AppDataSource.getRepository(NovelAuthorEntity)
export const novelThreadRepository = AppDataSource.getRepository(NovelThreadEntity)
export const novelPostRepository = AppDataSource.getRepository(NovelPostEntity)