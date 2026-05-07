import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Response } from 'express';

interface SseClient {
  userId: string;
  role: string;
  res: Response;
}

@Injectable()
export class SseService {
  private clients: SseClient[] = [];

  addClient(userId: string, role: string, res: Response) {
    this.clients.push({ userId, role, res });
  }

  removeClient(res: Response) {
    this.clients = this.clients.filter((client) => client.res !== res);
  }

  @OnEvent('cv.event')
  handleCvEvent(event: {
    cvId: number;
    userId: number;
    ownerId: number;
    type: string;
    date: Date;
  }) {
    this.clients.forEach((client) => {
      const isAdmin = client.role.toUpperCase() === 'ADMIN';
      // notify the CV owner, not just whoever triggered the operation
      const isOwner = client.userId === String(event.ownerId);

      if (isAdmin || isOwner) {
        client.res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    });
  }
}
