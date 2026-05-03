import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Cv {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  firstname: string;

  @Column()
  age: number;

  @Column({ unique: true })
  cin: string;

  @Column()
  job: string;

  @Column({ nullable: true })
  path: string;

  @ManyToOne(() => User, (user) => user.cvs, { eager: true })
  user: User;

  @Column()
  userId: number;
}
