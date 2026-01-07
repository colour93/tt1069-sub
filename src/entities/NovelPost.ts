import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { NovelThreadEntity } from "./NovelThread";

@Entity({ name: "novel_post" })
export class NovelPostEntity {
  @PrimaryColumn({ type: "numeric" })
  id!: number;

  @ManyToOne(() => NovelThreadEntity, (thread) => thread.posts, { onDelete: "CASCADE" })
  thread!: NovelThreadEntity;

  @Column({ type: "numeric" })
  threadId!: number;

  @Column({ type: "numeric", nullable: true })
  floor?: number | null;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "timestamptz", nullable: true })
  publishedAt?: Date | null;

  @Column({ default: false })
  isPushed!: boolean;
}

