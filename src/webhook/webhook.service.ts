import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { createHmac } from 'crypto';
import { Webhook } from './entities/webhook.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepo: Repository<Webhook>,
  ) {}

  create(dto: CreateWebhookDto): Promise<Webhook> {
    return this.webhookRepo.save(this.webhookRepo.create(dto));
  }

  findAll(): Promise<Webhook[]> {
    return this.webhookRepo.find();
  }

  async remove(id: number): Promise<void> {
    await this.webhookRepo.delete(id);
  }

  @OnEvent('cv.event')
  async handleCvEvent(event: {
    cvId: number;
    userId: number;
    ownerId: number;
    type: string;
    date: Date;
  }) {
    const webhooks = await this.webhookRepo.find({ where: { active: true } });
    if (!webhooks.length) return;

    const payload = JSON.stringify({
      event: event.type,
      cvId: event.cvId,
      userId: event.userId,
      ownerId: event.ownerId,
      date: event.date,
      timestamp: new Date().toISOString(),
    });

    for (const webhook of webhooks) {
      if (!webhook.events.includes(event.type)) continue;

      const signature = createHmac('sha256', webhook.secret)
        .update(payload)
        .digest('hex');

      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': `sha256=${signature}`,
          },
          body: payload,
        });
        this.logger.log(`Webhook delivered to ${webhook.url} — status ${res.status}`);
      } catch (err) {
        this.logger.error(`Webhook delivery failed for ${webhook.url}: ${err}`);
      }
    }
  }
}
