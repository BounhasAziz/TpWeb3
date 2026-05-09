import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CvEvent } from './entities/cv-event.entity';
import { CvEventType } from './enums/cv-event-type.enum';

@Injectable()
export class CvEventService {
  constructor(
    @InjectRepository(CvEvent)
    private readonly cvEventRepo: Repository<CvEvent>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('cv.operation')
  async handleCvOperation(data: {
    type: CvEventType;
    cvId: number;
    userId: number;
    ownerId: number;
  }): Promise<void> {
    const event = this.cvEventRepo.create({
      type: data.type,
      cvId: data.cvId,
      userId: data.userId,
    });
    await this.cvEventRepo.save(event);
    this.eventEmitter.emit('cv.event', { ...data, date: new Date() });
  }

  findAll(): Promise<CvEvent[]> {
    return this.cvEventRepo.find({ order: { date: 'DESC' } });
  }

  findByUser(userId: number): Promise<CvEvent[]> {
    return this.cvEventRepo.find({ where: { userId }, order: { date: 'DESC' } });
  }

  findByCv(cvId: number): Promise<CvEvent[]> {
    return this.cvEventRepo.find({ where: { cvId }, order: { date: 'DESC' } });
  }
}
