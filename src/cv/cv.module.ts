import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cv } from './entities/cv.entity';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { CvEventModule } from '../cv-event/cv-event.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cv]), CvEventModule],
  providers: [CvService],
  controllers: [CvController],
})
export class CvModule {}
