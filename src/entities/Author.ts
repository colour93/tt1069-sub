import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm"
import { ThreadEntity } from "./Thread"

@Entity({ name: 'author' })
export class AuthorEntity {
  @PrimaryColumn({ type: 'numeric' })
  id!: number

  @Column()
  name!: string

  @OneToMany(() => ThreadEntity, thread => thread.author)
  threads?: ThreadEntity[]
}
