import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CvEvent } from './entities/cv-event.entity';
import { CvEventType } from './enums/cv-event-type.enum';
import { Cv } from '../cv/entities/cv.entity';

@Injectable()
export class CvEventService {
  constructor(
    @InjectRepository(CvEvent)
    private readonly cvEventRepo: Repository<CvEvent>,
    @InjectRepository(Cv)
    private readonly cvRepo: Repository<Cv>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('cv.operation')
  async handleCvOperation(data: {
    type: CvEventType;
    cvId: number;
    userId: number;
    ownerId: number;
  }): Promise<void> {
    // attempt to include a snapshot of the CV when available
    let snapshot: Cv | null = null;
    try {
      snapshot = await this.cvRepo.findOne({ where: { id: data.cvId } });
    } catch {
      snapshot = null;
    }

    const event = this.cvEventRepo.create({
      type: data.type,
      cvId: data.cvId,
      userId: data.userId,
      snapshot: snapshot ? snapshot : null,
    });

    await this.cvEventRepo.save(event);

    this.eventEmitter.emit('cv.event', { ...data, date: new Date(), snapshot });
  }

  findAll(): Promise<CvEvent[]> {
    return this.cvEventRepo.find({ order: { date: 'DESC' } });
  }

  findByUser(userId: number): Promise<CvEvent[]> {
    return this.cvEventRepo.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  findByCv(cvId: number): Promise<CvEvent[]> {
    return this.cvEventRepo.find({ where: { cvId }, order: { date: 'DESC' } });
  }
}
