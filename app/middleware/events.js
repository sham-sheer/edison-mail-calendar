import { normalize, schema } from 'normalizr';

const fetchEvents = (request, items, resolve, reject) => {
  request.execute(
    resp => {
      const newItems = items.concat(resp.result.items);
      const pageToken = resp.nextPageToken;
      const syncToken = resp.nextSyncToken;
      if (pageToken !== undefined) {
        const nextRequest = window.gapi.client.calendar.events.list({
          calendarId: 'primary',
          pageToken
        });
        fetchEvents(nextRequest, newItems, resolve, reject);
      } else {
        localStorage.setItem('sync', syncToken);
        resolve(newItems);
      }
    },
    error => {
      if (error.code === 410) {
        console.log('Invalid sync token, clearing event store and re-syncing.');
        localStorage.deleteItem('sync');
        const newRequest = window.gapi.client.calendar.events.list({
          calendarId: 'primary'
        });
        fetchEvents(newRequest, items, resolve, reject);
      } else {
        console.log(error);
        reject('Something went wrong, Please refresh and try again');
      }
    }
  );
};

const eventsMiddleware = store => next => action => {
  if (action.type === 'GET_EVENTS_BEGIN') {
    window.gapi.client.load('calendar', 'v3', () => {
      let request = window.gapi.client.calendar.events.list({
        calendarId: 'primary'
      });
      const syncToken = localStorage.getItem('sync');
      if (syncToken == null) {
        console.log('Performing full sync');
      } else {
        console.log('Performing incremental sync');
        request = window.gapi.client.calendar.events.list({
          calendarId: 'primary',
          syncToken
        });
      }
      const result = [];
      new Promise((resolve, reject) => {
        fetchEvents(request, result, resolve, reject);
      }).then(async response => {
        const myData = { events: response };
        const singleEvent = new schema.Entity('events');
        const mySchema = { events: [singleEvent] };
        const normalizedResults = normalize(myData, mySchema);
        console.log('midware');
        next({
          type: 'GET_EVENTS_SUCCESS',
          payload: {
            data: response
          }
        });
      });
    });
  }
  if (action.type === 'POST_EVENT_BEGIN') {
    const calendarObject = {
      calendarId: 'primary',
      resource: action.payload
    };

    // deprecated function: take note
    window.gapi.client.load('calendar', 'v3', () => {
      const request = window.gapi.client.calendar.events.insert(calendarObject);
      request.execute(resp => {
        const newId = resp.id;
        console.log('midware?!');
        next(
          {
            type: 'POST_EVENT_SUCCESS',
            payload: {
              data: [resp]
            }
          },
          error => {
            next({
              type: 'POST_EVENT_FAILURE',
              payload: error
            });
          }
        );
      });
    });
  }

  // if (action.type === 'REMOVE_EVENT_BEGIN') {
  // }

  if (action.type === 'post') return next(action);
};

export default eventsMiddleware;
