import { createConnection, Repository } from 'typeorm';
import { ActiveAuthRequest, Pilet, PiletDb } from '../types';
import { PiletEntity } from './entities/pilet.entity';
import { PiletFilesEntity } from './entities/pilet-files.entity';

import 'dotenv/config';

let piletRepository: Repository<PiletEntity>;
let piletVersionsRepository: Repository<PiletFilesEntity>;

export async function connectToDatabase() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DB,
    entities: [PiletEntity, PiletFilesEntity],
    synchronize: true,
    ssl: true,
  });
  piletRepository = connection.getRepository(PiletEntity);
  piletVersionsRepository = connection.getRepository(PiletFilesEntity);
}

export async function getPilets(): Promise<Array<Pilet>> {
  const pilets = await piletRepository.find({
    // where: {},
    // select: ["name", "version"],
    // groupBy: ["name", "version"],
    relations: ['files'],
  });
  console.log('run');

  // const pilets = await piletRepository
  //   .createQueryBuilder('p')
  //   .select(['name', 'version'])
  //   .groupBy('name, version')
  //   .leftJoinAndSelect('p.files', 'files')
  //   .getMany();

  return pilets.map((pilet) => ({
    meta: pilet.meta,
    files: pilet.mapFilesToView(),
  }));
}

// const pilets = await piletRepository
//   .createQueryBuilder('p')
//   .where((qb) => {
//     const sub = qb.sel
//     return qb
//   })
//   .getMany();

// const piletVersions = await piletVersionsRepository.find({
//   where: pilets.map((p) => ({
//     piletId: p.id,
//     version: p.version,
//   })),
// });
//
// return piletVersions.map((piletVersion) => ({
//   meta: piletVersion.pilet.meta,
//   files: {
//     [piletVersion.filename]: piletVersion.file,
//   },
// }));

// console.log(pilets);
//
// return pilets.map<Pilet>((pilet) => ({
//   meta: pilet.meta,
//   files: pilet.mapFilesToView(),
//   // files: pilet.files.reduce<PackageFiles>((acc, el) => {
//   //   acc[el.filename] = el.file;
//   //   return acc;
//   // }, {}),
// }));
// }

// export async function getPilets(): Promise<Array<Pilet>> {
//   const pilets = await piletRepository.find({
//     where: {},
//     relations: ['files'],
//   });
//
//   const piletVersions = await piletVersionsRepository.find({
//     where: pilets.map((p) => ({
//       piletId: p.id,
//       version: p.version,
//     })),
//   });
//
//   return piletVersions.map((piletVersion) => ({
//     meta: piletVersion.pilet.meta,
//     files: {
//       [piletVersion.filename]: piletVersion.file,
//     },
//   }));
//
//   // console.log(pilets);
//   //
//   // return pilets.map<Pilet>((pilet) => ({
//   //   meta: pilet.meta,
//   //   files: pilet.mapFilesToView(),
//   //   // files: pilet.files.reduce<PackageFiles>((acc, el) => {
//   //   //   acc[el.filename] = el.file;
//   //   //   return acc;
//   //   // }, {}),
//   // }));
// }

export async function getPilet(name: string, version: string): Promise<Pilet | undefined> {
  const pilet = await piletRepository.findOne(
    { name, version },
    {
      relations: ['files'],
    },
  );

  return {
    meta: pilet.meta,
    files: pilet.mapFilesToView(),
  };
}

export async function setPilet(pilet: Pilet) {
  // const { name, version } = pilet.meta;

  const piletEntity = await piletRepository.save({
    meta: pilet.meta,
  });

  const createdPiletFiles = Object.entries(pilet.files)
    .map<PiletFilesEntity>(([filename, file]) => ({
      filename,
      file,
      piletId: piletEntity.id,
      version: '',
    }))
    .map(piletVersionsRepository.create);

  await piletVersionsRepository.save(createdPiletFiles);
}

export const piletData: PiletDb = {};

const activeAuthRequests: Array<ActiveAuthRequest> = [];

export function getActiveAuthRequest(id: string) {
  return activeAuthRequests.find((r) => r.id === id);
}

export function appendAuthRequest(request: ActiveAuthRequest) {
  activeAuthRequests.push(request);

  return () => {
    const idx = activeAuthRequests.indexOf(request);
    const req = activeAuthRequests[idx];
    activeAuthRequests.splice(idx, 1);
    req.notifiers.forEach((n) => n(false));
  };
}

// export function getActiveAuthRequest(id: string) {
//   return authRequestRepository.findOne(id);
// }
//
// export async function appendAuthRequest(request: ActiveAuthRequest) {
//   await authRequestRepository.save(request);
//
//   return async () => {
//     const req = await authRequestRepository.findOne(request.id);
//     if (req) {
//       await authRequestRepository.remove(req);
//     }
//   };
// }
