import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvEvent } from './entities/cv-event.entity';
import { CvEventService } from './cv-event.service';
import { CvEventController } from './cv-event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CvEvent])],
  providers: [CvEventService],
  controllers: [CvEventController],
  exports: [CvEventService],
})
export class CvEventModule {}
