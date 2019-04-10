/*import getDb from '../../db';
import md5 from 'md5';
import { normalize, schema } from 'normalizr';



async function storeEvents(events){
  const db = await getDb();
  const dbEvents = filter(events);
  const addEvents = [];
  //need to preprocess data
  const results = dbEvents.map(async dbEvent => {
    if(!!dbEvent.id) {
      try {
        await db.events.upsert(dbEvent);
      } catch(e) {
        console.log(e);
      }
      return dbEvent;
    }
  });
  let values = await Promise.all(results);
  return values;
}

async function retrieveEvents() {
  const db = await getDb();
  let data = [];
  await db.events.find().exec().then(events => {
      data = events.map(singleEvent => {
        return {
          'id' : md5(singleEvent.id),
          'end' : singleEvent.end,
          'start': singleEvent.start,
          'summary': singleEvent.summary,
          'organizer': singleEvent.organizer,
          'recurrence': singleEvent.recurrence,
          'iCalUID': singleEvent.iCalUID,
          'attendees': singleEvent.attendees
        }
      });
  });
  return data;
}
/*export const storeEventsMiddleware = store => next => action => {
  if(action.type === 'BEGIN_STORE_EVENTS') {
    storeEvents(action.payload).then((resp) => {
      next({
        type: 'SUCCESS_STORED_EVENTS',
        payload: resp
      })
    }, (error) => {
      console.log(error);
    })
  }
  return next(action);
}*/

/*export const apiSuccessToDbMiddleware = store => next => action => {
  if(action.type === 'POST_EVENT_SUCCESS') {
    next({
      type: 'BEGIN_STORE_EVENTS',
      payload: action.payload
    })
  }
  if(action.type === 'GET_EVENTS_SUCCESS') {
    next({
      type: 'BEGIN_STORE_EVENTS',
      payload: action.payload
    })
  }
  return next(action);
}

/*export const eventsStoreOutMiddleware = store => next => action => {
  if(action.type === 'RETRIEVE_STORED_EVENTS') {
    retrieveEvents().then((resp) => {
      next({
        type: 'UPDATE_STORED_EVENTS',
        payload: resp
      })
    });
  }
  return next(action);
}

const filter = (events) => {
  if(events.data.length > 0) {
    const formated_events = events.data
    .map(eachEvent => {
        return  ({
          'id' : md5(eachEvent.id),
          'end' : eachEvent.end,
          'start': eachEvent.start,
          'summary': eachEvent.summary,
          'organizer': eachEvent.organizer,
          'recurrence': eachEvent.recurrence,
          'iCalUID': eachEvent.iCalUID,
          'attendees': eachEvent.attendees
        })
      }
    );
    return formated_events;
  }
  else {
    return [];
  }
}*/
