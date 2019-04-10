import { createSelector } from 'reselect';
import moment from 'moment';

const getEvents = state => state.events.calEvents;

//process google events data for React Big calendar
export const getFilteredEvents = createSelector(
  [getEvents],
  (normalized_data) => {
    const data = Object.values(normalized_data);
    const formated_events = data
      .map(eachEvent => {
        if(eachEvent.end.date === undefined) {
          return {
            id: eachEvent.id,
            title: eachEvent.summary,
            end: new Date(eachEvent.end.dateTime),
            start: new Date(eachEvent.start.dateTime)
          };
        }
        else {
          return {
            id: eachEvent.id,
            title: eachEvent.summary,
            end:  new Date(moment(eachEvent.end.date).format()),
            start: new Date(moment(eachEvent.start.date).format())
          };
        }
      }
      );
    return formated_events;
  }
);
