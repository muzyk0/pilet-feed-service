import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PiletEntity } from './pilet.entity';

@Entity({ name: 'pilet_files' })
export class PiletFilesEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => PiletEntity, (pilet) => pilet.files)
  pilet?: PiletEntity;

  @Column()
  piletId: number;

  @Column('bytea')
  file: Buffer;

  @Column()
  filename: string;
}
