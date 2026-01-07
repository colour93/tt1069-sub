import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { NovelThreadEntity } from "./NovelThread";

@Entity({ name: "novel_author" })
export class NovelAuthorEntity {
  @PrimaryColumn({ type: "numeric" })
  id!: number;

  @Column()
  name!: string;

  @OneToMany(() => NovelThreadEntity, (thread) => thread.author)
  threads?: NovelThreadEntity[];
}

