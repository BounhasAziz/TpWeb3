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
//types for playloads of different events
type JoinPayload = {
  room: string;
  username: string;
};

type LeavePayload = {
  room: string;
};

type ChatMessagePayload = {
  room: string;
  username: string;
  message: string;
};
// This gateway handles real-time chat functionality using WebSockets.
//cors is enabled to allow connections from any origin,useful in testing
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server; // This will be initialized by NestJS to the Socket.IO server instance

  private readonly logger = new Logger(ChatGateway.name);

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
      client.emit('errorMessage', {
        message: 'room and username are required',
      });
      return;
    }

    await client.join(payload.room);
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
    // Notify others in the room that a user has left
    await client.leave(payload.room);
    client.emit('leftRoom', { room: payload.room });
  }

  @SubscribeMessage('sendMessage')
  handleMessage(@MessageBody() payload: ChatMessagePayload) {
    if (!payload?.room || !payload?.username || !payload?.message) {
      return {
        event: 'errorMessage',
        data: { message: 'invalid message payload' },
      };
    }
    // Broadcast the message to everyone in the room
    this.server.to(payload.room).emit('receiveMessage', {
      username: payload.username,
      message: payload.message,
      room: payload.room,
      sentAt: new Date().toISOString(),
    });
  }
}
