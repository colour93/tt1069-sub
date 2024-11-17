import { Entity, Column, PrimaryColumn, ManyToOne } from "typeorm"
import { Author } from "./Author"

@Entity()
export class Thread {
  @PrimaryColumn()
  id!: number

  @Column()
  title!: string

  @ManyToOne(() => Author, author => author.threads)
  author!: Author

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
}
