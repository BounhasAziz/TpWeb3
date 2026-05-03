import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CvModule } from './cv/cv.module';
import { CvEventModule } from './cv-event/cv-event.module';
import { User } from './user/entities/user.entity';
import { Cv } from './cv/entities/cv.entity';
import { CvEvent } from './cv-event/entities/cv-event.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'cvtech',
      entities: [User, Cv, CvEvent],
      synchronize: true,
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    UserModule,
    CvModule,
    CvEventModule,
  ],
})
export class AppModule {}
