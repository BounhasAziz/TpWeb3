import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { Reaction } from '../entities/reaction.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Reaction)
    private readonly reactionRepo: Repository<Reaction>,
  ) {}

  async saveMessage(data: {
    room: string;
    username: string;
    userId: number;
    content: string;
    parentId?: number;
  }): Promise<Message> {
    const msg = this.messageRepo.create({
      room: data.room,
      username: data.username,
      userId: data.userId,
      content: data.content,
      parentId: data.parentId ?? null,
    });
    return this.messageRepo.save(msg);
  }

  getHistory(room: string, limit = 50): Promise<Message[]> {
    return this.messageRepo.find({
      where: { room },
      order: { createdAt: 'ASC' },
      take: limit,
      relations: ['reactions'],
    });
  }

  async toggleReaction(
    messageId: number,
    userId: number,
    emoji: string,
  ): Promise<{ added: boolean; reactions: Reaction[] }> {
    const existing = await this.reactionRepo.findOne({
      where: { messageId, userId, emoji },
    });

    if (existing) {
      await this.reactionRepo.remove(existing);
    } else {
      await this.reactionRepo.save(
        this.reactionRepo.create({ messageId, userId, emoji }),
      );
    }

    const reactions = await this.reactionRepo.find({ where: { messageId } });
    return { added: !existing, reactions };
  }

  findMessage(id: number): Promise<Message | null> {
    return this.messageRepo.findOne({
      where: { id },
      relations: ['reactions'],
    });
  }
}
