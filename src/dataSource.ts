import { DataSource } from "typeorm";
import { AuthorEntity } from "./entities/Author";
import { ThreadEntity } from "./entities/Thread";
import { MessageEntity } from "./entities/Message";
import ConfigManager from "./config";

const AppDataSource = new DataSource({
  ...ConfigManager.config.db,
  entities: [AuthorEntity, ThreadEntity, MessageEntity],
  synchronize: true,
  logging: false,
})

export default AppDataSource