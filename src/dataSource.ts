import { DataSource } from "typeorm";
import { Author } from "./entities/Author";
import { Thread } from "./entities/Thread";
import ConfigManager from "./config";

const AppDataSource = new DataSource({
  ...ConfigManager.config.db,
  entities: [Author, Thread],
  synchronize: true,
  logging: false,
})

export default AppDataSource