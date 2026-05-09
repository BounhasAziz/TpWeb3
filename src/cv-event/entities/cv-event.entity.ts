import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CvEventType } from '../enums/cv-event-type.enum';

@Entity()
export class CvEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: CvEventType })
  type: CvEventType;

  @CreateDateColumn()
  date: Date;

  @Column()
  cvId: number;

  @Column()
  userId: number;

  @Column({ type: 'json', nullable: true })
  snapshot: any | null;
}
