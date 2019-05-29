import { createSelector } from 'reselect';
import moment from 'moment';
import uniqid from 'uniqid';

const getEvents = (state) => state.events.calEvents;

// process google events data for React Big calendar
const getFilteredEvents = createSelector(
  [getEvents],
  (normalizedData) => {
    const data = Object.values(normalizedData);
    const flatData = data.reduce((acc, val) => acc.concat(val), []);
    const formatedEvents = flatData.map((eachEvent) => ({
      id: eachEvent.id,
      title: eachEvent.summary,
      end: new Date(moment(eachEvent.end.dateTime).format()),
      start: new Date(moment(eachEvent.start.dateTime).format()),
      iCalUID: eachEvent.iCalUID
    }));
    return formatedEvents;
  }
);

export default getFilteredEvents;
