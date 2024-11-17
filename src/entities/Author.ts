import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm"
import { Thread } from "./Thread"

@Entity()
export class Author {
  @PrimaryColumn()
  id!: number

  @Column()
  name!: string

  @OneToMany(() => Thread, thread => thread.author)
  threads?: Thread[]
}
