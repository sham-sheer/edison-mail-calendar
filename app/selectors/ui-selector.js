import { createSelector } from 'reselect';
import moment from 'moment';

const getEvents = state => state.events.calEvents;

// process google events data for React Big calendar
const getFilteredEvents = createSelector(
  [getEvents],
  normalizedData => {
    const data = Object.values(normalizedData);
    console.log(data);
    const formatedEvents = data
      .filter(obj => obj.hide === false)
      .map(eachEvent => {
        if (eachEvent.end.date === undefined) {
          return {
            id: eachEvent.id,
            title: eachEvent.summary,
            end: new Date(eachEvent.end.dateTime),
            start: new Date(eachEvent.start.dateTime)
          };
        }

        return {
          id: eachEvent.id,
          title: eachEvent.summary,
          end: new Date(moment(eachEvent.end.date).format()),
          start: new Date(moment(eachEvent.start.date).format())
        };
      });
    return formatedEvents;
  }
);

export default getFilteredEvents;
