import * as RxDB from 'rxdb';
import schemas from './schemas';

RxDB.plugin(require('pouchdb-adapter-idb'));
RxDB.plugin(require('pouchdb-adapter-http'));

let dbPromise = null;

const collections = [
  {
    name: 'calendarDb',
    schema: schemas
  }
];

export const createDb = async () => {
  const db = await RxDB.create({
    name: 'eventsdb',
    adapter: 'idb',
    queryChangeDetection: true
  });
  window['db'] = db;
  await Promise.all(
    Object.entries(schemas)
      .map(([name, schema]) => db.collection({ name, schema }))
  );
  return db;
};

export default () => {
  //RxDB.removeDatabase('eventsdb', 'idb');
  if(!dbPromise) {
    dbPromise = createDb();
  }
  return dbPromise;
};
