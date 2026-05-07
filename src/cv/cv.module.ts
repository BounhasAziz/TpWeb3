import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cv } from './entities/cv.entity';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cv])],
  providers: [CvService],
  controllers: [CvController],
  exports: [CvService],
})
export class CvModule {}
