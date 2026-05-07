import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reaction } from './reaction.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  room: string;

  @Column()
  username: string;

  @Column()
  userId: number;

  @Column('text')
  content: string;

  @Column({ nullable: true, type: 'int' })
  parentId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reaction, (r) => r.message, { eager: true, cascade: true })
  reactions: Reaction[];
}
