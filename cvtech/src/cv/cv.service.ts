import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cv } from './entities/cv.entity';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { CvEventService } from '../cv-event/cv-event.service';
import { CvEventType } from '../cv-event/enums/cv-event-type.enum';

@Injectable()
export class CvService {
  constructor(
    @InjectRepository(Cv)
    private readonly cvRepo: Repository<Cv>,
    private readonly cvEventService: CvEventService,
  ) {}

  async create(dto: CreateCvDto, userId: number): Promise<Cv> {
    const cv = this.cvRepo.create({ ...dto, userId });
    const saved = await this.cvRepo.save(cv);
    await this.cvEventService.logEvent(CvEventType.CREATED, saved.id, userId);
    return saved;
  }

  findAll(): Promise<Cv[]> {
    return this.cvRepo.find();
  }

  async findOne(id: number): Promise<Cv> {
    const cv = await this.cvRepo.findOne({ where: { id } });
    if (!cv) throw new NotFoundException(`CV #${id} not found`);
    return cv;
  }

  async update(id: number, dto: UpdateCvDto, userId: number): Promise<Cv> {
    const cv = await this.findOne(id);
    Object.assign(cv, dto);
    const saved = await this.cvRepo.save(cv);
    await this.cvEventService.logEvent(CvEventType.UPDATED, id, userId);
    return saved;
  }

  async remove(id: number, userId: number): Promise<void> {
    const cv = await this.findOne(id);
    await this.cvRepo.remove(cv);
    await this.cvEventService.logEvent(CvEventType.DELETED, id, userId);
  }
}
