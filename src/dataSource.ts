import "reflect-metadata";
import { DataSource } from "typeorm";
import { AuthorEntity } from "./entities/Author";
import { ThreadEntity } from "./entities/Thread";
import { MessageEntity } from "./entities/Message";
import { NovelAuthorEntity } from "./entities/NovelAuthor";
import { NovelThreadEntity } from "./entities/NovelThread";
import { NovelPostEntity } from "./entities/NovelPost";
import ConfigManager from "./config";

const AppDataSource = new DataSource({
  ...ConfigManager.config.db,
  entities: [AuthorEntity, ThreadEntity, MessageEntity, NovelAuthorEntity, NovelThreadEntity, NovelPostEntity],
  synchronize: true,
  logging: false,
})

export default AppDataSource