// Imports nécessaires pour le WebSocket gateway avec NestJS
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

// Types pour les données reçues via WebSocket
type JoinPayload = { room: string; username: string }; // Pour rejoindre une salle
type LeavePayload = { room: string }; // Pour quitter une salle
type SendMessagePayload = {
  // Pour envoyer un message
  room: string;
  username: string;
  userId: number;
  content: string;
};
type ReplyPayload = {
  // Pour répondre à un message spécifique
  room: string;
  username: string;
  userId: number;
  content: string;
  parentId: number; // ID du message parent
};
type ReactPayload = { messageId: number; userId: number; emoji: string }; // Pour ajouter/supprimer des réactions
type TypingPayload = { room: string; username: string }; // Pour indiquer qu'on tape
type GetHistoryPayload = { room: string }; // Pour récupérer l'historique

// Décorateur WebSocketGateway pour configurer le serveur WebSocket
// cors: { origin: true, credentials: true } accepte les requêtes cross-origin avec credentials
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // Instance du serveur Socket.IO pour émettre des messages
  @WebSocketServer()
  server!: Server;

  // Logger pour tracer les événements
  private readonly logger = new Logger(ChatGateway.name);

  // Injection des services
  constructor(
    private readonly chatService: ChatService,
    private readonly cvService: CvService,
  ) {}

  // Appelée quand un client se connecte au serveur WebSocket
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Notifie tous les autres clients qu'un utilisateur s'est connecté
    client.broadcast.emit('userConnected', { socketId: client.id });
  }

  // Appelée quand un client se déconnecte du serveur WebSocket
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Notifie tous les autres clients qu'un utilisateur s'est déconnecté
    client.broadcast.emit('userDisconnected', { socketId: client.id });
  }

  // Événement: rejoindre une salle de chat
  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    // Validation: la salle et le nom d'utilisateur sont obligatoires
    if (!payload?.room || !payload?.username) {
      client.emit('errorMessage', {
        message: 'room and username are required',
      });
      return;
    }
    // Ajoute le client à la salle
    await client.join(payload.room);
    // Récupère l'historique des messages et l'envoie au client
    const history = await this.chatService.getHistory(payload.room);
    client.emit('roomHistory', { room: payload.room, messages: history });

    // Notifie tous les utilisateurs de la salle que quelqu'un a rejoint
    this.server.to(payload.room).emit('systemMessage', {
      message: `${payload.username} joined ${payload.room}`,
      room: payload.room,
    });
  }

  // Événement: quitter une salle de chat
  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeavePayload,
  ) {
    if (!payload?.room) {
      client.emit('errorMessage', { message: 'room is required' });
      return;
    }
    // Retire le client de la salle
    await client.leave(payload.room);
    // Confirme au client qu'il a quitté la salle
    client.emit('leftRoom', { room: payload.room });
  }

  // Événement: envoyer un message dans une salle
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    // Validation: tous les champs sont obligatoires
    if (
      !payload?.room ||
      !payload?.username ||
      !payload?.content ||
      !payload?.userId
    ) {
      client.emit('errorMessage', {
        message: 'room, username, userId and content are required',
      });
      return;
    }

    // Sauvegarde le message en base de données
    const saved = await this.chatService.saveMessage({
      room: payload.room,
      username: payload.username,
      userId: payload.userId,
      content: payload.content,
    });

    // Envoie le message à tous les utilisateurs de la salle
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

  // Événement: répondre à un message spécifique (thread de conversation)
  @SubscribeMessage('replyToMessage')
  async handleReply(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReplyPayload,
  ) {
    // Validation: tous les champs sont obligatoires
    if (
      !payload?.room ||
      !payload?.username ||
      !payload?.content ||
      !payload?.userId ||
      !payload?.parentId
    ) {
      client.emit('errorMessage', {
        message: 'room, username, userId, content and parentId are required',
      });
      return;
    }

    // Vérifie que le message parent existe
    const parent = await this.chatService.findMessage(payload.parentId);
    if (!parent) {
      client.emit('errorMessage', {
        message: `Message #${payload.parentId} not found`,
      });
      return;
    }

    // Sauvegarde la réponse avec référence au message parent
    const saved = await this.chatService.saveMessage({
      room: payload.room,
      username: payload.username,
      userId: payload.userId,
      content: payload.content,
      parentId: payload.parentId,
    });

    // Envoie la réponse à tous les utilisateurs de la salle
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

  // Événement: ajouter ou supprimer une réaction emoji à un message
  @SubscribeMessage('reactToMessage')
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReactPayload,
  ) {
    // Validation: tous les champs sont obligatoires
    if (!payload?.messageId || !payload?.userId || !payload?.emoji) {
      client.emit('errorMessage', {
        message: 'messageId, userId and emoji are required',
      });
      return;
    }

    // Vérifie que le message existe
    const message = await this.chatService.findMessage(payload.messageId);
    if (!message) {
      client.emit('errorMessage', {
        message: `Message #${payload.messageId} not found`,
      });
      return;
    }

    // Toggle la réaction (ajoute ou supprime)
    const { added, reactions } = await this.chatService.toggleReaction(
      payload.messageId,
      payload.userId,
      payload.emoji,
    );

    // Notifie tous les utilisateurs de la salle que la réaction a changé
    this.server.to(message.room).emit('reactionUpdated', {
      messageId: payload.messageId,
      emoji: payload.emoji,
      userId: payload.userId,
      added,
      reactions,
    });
  }

  // Événement: notifier que l'utilisateur est en train de taper
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    if (!payload?.room || !payload?.username) return;
    // Envoie à tous les autres utilisateurs de la salle que quelqu'un tape
    client
      .to(payload.room)
      .emit('userTyping', { username: payload.username, room: payload.room });
  }

  // Événement: récupérer l'historique des messages d'une salle
  @SubscribeMessage('getHistory')
  async handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GetHistoryPayload,
  ) {
    if (!payload?.room) {
      client.emit('errorMessage', { message: 'room is required' });
      return;
    }
    // Récupère les messages de la salle et les envoie au client
    const messages = await this.chatService.getHistory(payload.room);
    client.emit('roomHistory', { room: payload.room, messages });
  }
}
