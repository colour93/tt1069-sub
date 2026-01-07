import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { NovelAuthorEntity } from "./NovelAuthor";
import { NovelPostEntity } from "./NovelPost";

@Entity({ name: "novel_thread" })
export class NovelThreadEntity {
  @PrimaryColumn({ type: "numeric" })
  id!: number;

  @Column()
  title!: string;

  @ManyToOne(() => NovelAuthorEntity, (author) => author.threads)
  author?: NovelAuthorEntity;

  @Column({ default: false })
  subscribed!: boolean;

  @Column({ type: "timestamptz", nullable: true })
  publishedAt?: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  latestPostAt?: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  lastSyncedAt?: Date | null;

  @Column({ default: false })
  firstPushDone!: boolean;

  @OneToMany(() => NovelPostEntity, (post) => post.thread)
  posts?: NovelPostEntity[];
}
