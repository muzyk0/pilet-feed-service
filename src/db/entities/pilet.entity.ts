import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { PackageFiles, PiletMetadata } from '../../types';
import { PiletFilesEntity } from './pilet-files.entity';

@Unique(['name', 'version'])
@Entity({ name: 'pilets' })
export class PiletEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  version: string;

  @Column('jsonb')
  meta: PiletMetadata;

  @OneToMany(() => PiletFilesEntity, (file) => file.pilet)
  files: Array<PiletFilesEntity>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  mapFilesToView() {
    return this.files.reduce<PackageFiles>((acc, el) => {
      acc[el.filename] = el.file;
      return acc;
    }, {});
  }
}
