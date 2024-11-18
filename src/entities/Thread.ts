import { Entity, Column, PrimaryColumn, ManyToOne } from "typeorm"
import { AuthorEntity } from "./Author"

@Entity({ name: 'thread' })
export class ThreadEntity {
  @PrimaryColumn()
  id!: number

  @Column()
  title!: string

  @ManyToOne(() => AuthorEntity, author => author.threads)
  author!: AuthorEntity

  @Column()
  publishedAt!: Date

  @Column()
  category!: string

  @Column({ nullable: true })
  content?: string

  @Column({ type: 'simple-array', default: [] })
  imgList?: string[]

  @Column({ type: 'simple-array', default: [] })
  ed2kList?: string[]

  @Column({ default: false })
  isPushed!: boolean

  @Column({ default: false })
  isDeleted!: boolean

  @Column({ default: false })
  isDownloaded!: boolean
}
