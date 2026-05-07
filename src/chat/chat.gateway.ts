import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './services/chat.service';
import { CvService } from '../cv/cv.service';

type JoinPayload = { room: string; username: string };
type LeavePayload = { room: string };
type SendMessagePayload = { room: string; username: string; userId: number; content: string };
type ReplyPayload = { room: string; username: string; userId: number; content: string; parentId: number };
type ReactPayload = { messageId: number; userId: number; emoji: string };
type TypingPayload = { room: string; username: string };
type GetHistoryPayload = { room: string };

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly cvService: CvService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.broadcast.emit('userConnected', { socketId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    client.broadcast.emit('userDisconnected', { socketId: client.id });
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    if (!payload?.room || !payload?.username) {
      client.emit('errorMessage', { message: 'room and username are required' });
      return;
    }

    if (payload.room.startsWith('cv-')) {
      const cvId = parseInt(payload.room.split('-')[1], 10);
      if (isNaN(cvId)) {
        client.emit('errorMessage', { message: 'Invalid CV room format. Use cv-{id}' });
        return;
      }
      try {
        await this.cvService.findOne(cvId);
      } catch {
        client.emit('errorMessage', { message: `CV #${cvId} does not exist` });
        return;
      }
    }

    await client.join(payload.room);
    const history = await this.chatService.getHistory(payload.room);
    client.emit('roomHistory', { room: payload.room, messages: history });

    this.server.to(payload.room).emit('systemMessage', {
      message: `${payload.username} joined ${payload.room}`,
      room: payload.room,
    });
  }

  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeavePayload,
  ) {
    if (!payload?.room) {
      client.emit('errorMessage', { message: 'room is required' });
      return;
    }
    await client.leave(payload.room);
    client.emit('leftRoom', { room: payload.room });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    if (!payload?.room || !payload?.username || !payload?.content || !payload?.userId) {
      client.emit('errorMessage', { message: 'room, username, userId and content are required' });
      return;
    }

    const saved = await this.chatService.saveMessage({
      room: payload.room,
      username: payload.username,
      userId: payload.userId,
      content: payload.content,
    });

    this.server.to(payload.room).emit('receiveMessage', {
      id: saved.id,
      username: saved.username,
      userId: saved.userId,
      content: saved.content,
      room: saved.room,
      parentId: saved.parentId,
      createdAt: saved.createdAt,
      reactions: [],
    });
  }

  @SubscribeMessage('replyToMessage')
  async handleReply(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReplyPayload,
  ) {
    if (!payload?.room || !payload?.username || !payload?.content || !payload?.userId || !payload?.parentId) {
      client.emit('errorMessage', { message: 'room, username, userId, content and parentId are required' });
      return;
    }

    const parent = await this.chatService.findMessage(payload.parentId);
    if (!parent) {
      client.emit('errorMessage', { message: `Message #${payload.parentId} not found` });
      return;
    }

    const saved = await this.chatService.saveMessage({
      room: payload.room,
      username: payload.username,
      userId: payload.userId,
      content: payload.content,
      parentId: payload.parentId,
    });

    this.server.to(payload.room).emit('receiveReply', {
      id: saved.id,
      username: saved.username,
      userId: saved.userId,
      content: saved.content,
      room: saved.room,
      parentId: saved.parentId,
      createdAt: saved.createdAt,
      reactions: [],
    });
  }

  @SubscribeMessage('reactToMessage')
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReactPayload,
  ) {
    if (!payload?.messageId || !payload?.userId || !payload?.emoji) {
      client.emit('errorMessage', { message: 'messageId, userId and emoji are required' });
      return;
    }

    const message = await this.chatService.findMessage(payload.messageId);
    if (!message) {
      client.emit('errorMessage', { message: `Message #${payload.messageId} not found` });
      return;
    }

    const { added, reactions } = await this.chatService.toggleReaction(
      payload.messageId,
      payload.userId,
      payload.emoji,
    );

    this.server.to(message.room).emit('reactionUpdated', {
      messageId: payload.messageId,
      emoji: payload.emoji,
      userId: payload.userId,
      added,
      reactions,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    if (!payload?.room || !payload?.username) return;
    client.to(payload.room).emit('userTyping', { username: payload.username, room: payload.room });
  }

  @SubscribeMessage('getHistory')
  async handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GetHistoryPayload,
  ) {
    if (!payload?.room) {
      client.emit('errorMessage', { message: 'room is required' });
      return;
    }
    const messages = await this.chatService.getHistory(payload.room);
    client.emit('roomHistory', { room: payload.room, messages });
  }
}
