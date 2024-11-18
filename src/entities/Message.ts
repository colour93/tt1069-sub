import { Message } from "telegraf/typings/core/types/typegram"
import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity({ name: 'message' })
export class MessageEntity {
  @PrimaryColumn()
  id!: number

  @Column()
  threadId!: number

  @Column({ default: 'text' })
  type!: 'media' | 'text'

  @Column({ nullable: true })
  textMessage?: string
}
