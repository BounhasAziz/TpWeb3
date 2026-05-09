import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cv } from './entities/cv.entity';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { CvEventType } from '../cv-event/enums/cv-event-type.enum';

@Injectable()
export class CvService {
  constructor(
    @InjectRepository(Cv)
    private readonly cvRepo: Repository<Cv>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateCvDto, userId: number): Promise<Cv> {
    const cv = this.cvRepo.create({ ...dto, userId });
    const saved = await this.cvRepo.save(cv);
    this.eventEmitter.emit('cv.operation', {
      type: CvEventType.CREATED,
      cvId: saved.id,
      userId,
      ownerId: userId,
    });
    return saved;
  }

  findAll(userId: number, role: string): Promise<Cv[]> {
    if (role === 'ADMIN') return this.cvRepo.find();
    return this.cvRepo.find({ where: { userId } });
  }

  async findOne(id: number): Promise<Cv> {
    const cv = await this.cvRepo.findOne({ where: { id } });
    if (!cv) throw new NotFoundException(`CV #${id} not found`);
    return cv;
  }

  async update(id: number, dto: UpdateCvDto, userId: number, role: string): Promise<Cv> {
    const cv = await this.findOne(id);
    if (role !== 'ADMIN' && cv.userId !== userId) {
      throw new ForbiddenException('You can only update your own CVs');
    }
    Object.assign(cv, dto);
    const saved = await this.cvRepo.save(cv);
    this.eventEmitter.emit('cv.operation', {
      type: CvEventType.UPDATED,
      cvId: id,
      userId,
      ownerId: cv.userId,
    });
    return saved;
  }

  async remove(id: number, userId: number, role: string): Promise<void> {
    const cv = await this.findOne(id);
    if (role !== 'ADMIN' && cv.userId !== userId) {
      throw new ForbiddenException('You can only delete your own CVs');
    }
    const ownerId = cv.userId;
    await this.cvRepo.remove(cv);
    this.eventEmitter.emit('cv.operation', {
      type: CvEventType.DELETED,
      cvId: id,
      userId,
      ownerId,
    });
  }
}
