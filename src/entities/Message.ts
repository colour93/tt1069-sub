import { Message } from "telegraf/typings/core/types/typegram"
import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity({ name: 'message' })
export class MessageEntity {
  @PrimaryColumn({ type: 'numeric' })
  id!: number

  @Column({ type: 'numeric' })
  threadId!: number

  @Column({ type: 'numeric', nullable: true })
  chatId?: number

  @Column({ default: 'text' })
  type!: 'media' | 'text'

  @Column({ type: 'text', nullable: true })
  textMessage?: string
}
