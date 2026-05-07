import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './services/chat.service';
import { Message } from './entities/message.entity';
import { Reaction } from './entities/reaction.entity';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Reaction]), CvModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
