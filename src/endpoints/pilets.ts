import { RequestHandler } from 'express';
import { join, sep } from 'path';
import { lookup } from 'mime-types';
import { latestPilets /*storePilet*/ } from '../pilets';
import { getPilet } from '../db';
import { PiletDb } from '../types';

// const busboy = require('busboy');

export const getFiles = (): RequestHandler => async (req, res, next) => {
  const { name, version, org, file, 2: directoryPath = '' } = req.params;
  const id = org ? `@${org}/${name}` : name;
  const pilet = await getPilet(id, version);

  if (!pilet) {
    res.status(404).send('Pilet not found!');
  } else if (file) {
    const path = join(directoryPath, file).split(sep).join('/');
    const content = pilet.files[path];

    if (content) {
      const bufferContent = Buffer.from(pilet.files[path]);
      const tenYears = 24 * 60 * 60 * 365 * 10;

      res
        .header('Cache-Control', `public, max-age=${tenYears}`)
        .contentType(lookup(file) || 'application/octet-stream')
        .status(200)
        .send(bufferContent);
    } else {
      if (file.indexOf('.') !== -1) {
        res.status(404).send('File not found!');
      } else {
        next();
      }
    }
  } else {
    res.status(200).json({
      items: Object.keys(pilet.files),
    });
  }
};

export const getLatestPilets = (): RequestHandler => async (_, res) => {
  const items = await latestPilets();
  return res.json({
    items: items.map(({ author: _0, license: _1, description: _2, ...item }) => item),
  });
};

export interface SnapshotApi {
  read(db: PiletDb): Promise<void>;
  update(db: PiletDb): Promise<void>;
}

// export const publishPilet =
//   (rootUrl: string, snapshot: SnapshotApi): RequestHandler =>
//   (req, res) => {
//     let bb = req.busboy;
//
//     if (!bb) {
//       bb = busboy({ headers: req.headers });
//     }
//
//     if (bb) {
//       req.pipe(bb);
//
//       bb.on('file', (_: any, file: NodeJS.ReadableStream) =>
//         storePilet(file, rootUrl)
//           .then(snapshot.update)
//           .then(() =>
//             res.status(200).json({
//               success: true,
//             }),
//           )
//           .catch((err) =>
//             res.status(err.message?.indexOf('already exists') !== -1 ? 409 : 400).json({
//               success: false,
//               message: err.message,
//             }),
//           ),
//       );
//     } else {
//       res.status(400).json({
//         success: false,
//         message: 'Missing file upload.',
//       });
//     }
//   };
