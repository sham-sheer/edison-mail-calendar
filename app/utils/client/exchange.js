import md5 from 'md5';
import {
  ExchangeService,
  DateTime,
  Uri,
  WellKnownFolderName,
  CalendarView,
  ExchangeCredentials,
  Appointment,
  SendInvitationsMode,
  Item,
  PropertySet,
  ItemSchema,
  ConflictResolutionMode,
  SendInvitationsOrCancellationsMode,
  MessageBody,
  ItemId,
  BasePropertySet,
  ExtendedPropertyDefinition,
  BodyType,
  PropertyDefinitionBase,
  DeleteMode,
  AppointmentSchema,
  AppointmentType,
  ItemView
} from 'ews-javascript-api';
import moment from 'moment';
import uniqid from 'uniqid';
import * as ProviderTypes from '../constants';
import getDb from '../../db';
import {
  deleteEventSuccess,
  editEventSuccess,
  apiFailure,
  postEventSuccess
} from '../../actions/events';

export const filterExchangeUser = (jsonObj) => ({
  personId: md5(jsonObj.username),
  originalId: jsonObj.username,
  email: jsonObj.username,
  providerType: ProviderTypes.EXCHANGE,
  password: jsonObj.password
});

export const asyncGetSingleExchangeEvent = async (username, password, url, itemId) => {
  try {
    const exch = new ExchangeService();
    exch.Url = new Uri(url);
    exch.Credentials = new ExchangeCredentials(username, password);

    const appointment = await Appointment.Bind(exch, new ItemId(itemId));
    return appointment;
  } catch (error) {
    console.log('(asyncGetSingleExchangeEvent) Error: ', error);
    throw error;
  }
};

export const asyncCreateExchangeEvent = async (username, password, url, payload) => {
  try {
    const exch = new ExchangeService();
    exch.Url = new Uri(url);
    exch.Credentials = new ExchangeCredentials(username, password);

    const newEvent = new Appointment(exch);

    newEvent.Subject = payload.summary;
    newEvent.Body = new MessageBody('');
    newEvent.Start = new DateTime(moment.tz(payload.start.dateTime, payload.start.timezone));
    newEvent.End = new DateTime(moment.tz(payload.end.dateTime, payload.end.timezone));
    return await newEvent
      .Save(WellKnownFolderName.Calendar, SendInvitationsMode.SendToAllAndSaveCopy)
      .then(
        async () => {
          const item = await Item.Bind(exch, newEvent.Id);
          const filteredItem = ProviderTypes.filterIntoSchema(
            item,
            ProviderTypes.EXCHANGE,
            username,
            false
          );
          filteredItem.createdOffline = true;
          const db = await getDb();
          const eventDoc = db.events
            .find()
            .where('originalId')
            .eq(newEvent.Id.UniqueId);
          const temp = await db.events.find().exec();
          const result = await eventDoc.exec();

          if (result.length === 0) {
            db.events.upsert(filteredItem);
          } else if (result.length === 1) {
            await eventDoc.update({
              $set: filteredItem
            });
          } else {
            console.log('we should really not be here', result);
          }

          return postEventSuccess([item], 'EXCHANGE', username);
        },
        (error) => {
          throw error;
        }
      );
  } catch (error) {
    console.log('(asyncCreateExchangeEvent) Error: ', error);
    throw error;
  }
};

export const asyncUpdateExchangeEvent = async (singleAppointment, user, callback) => {
  try {
    return await singleAppointment
      .Update(ConflictResolutionMode.AlwaysOverwrite, SendInvitationsOrCancellationsMode.SendToNone)
      .then(
        async (success) => {
          const updatedItem = await asyncGetSingleExchangeEvent(
            user.email,
            user.password,
            'https://outlook.office365.com/Ews/Exchange.asmx',
            singleAppointment.Id.UniqueId
          );
          const db = await getDb();
          const doc = await db.events.atomicUpsert(
            ProviderTypes.filterIntoSchema(updatedItem, ProviderTypes.EXCHANGE, user.email, false)
          );
          const data = await db.events.find().exec();
          callback();
          return editEventSuccess(updatedItem);
        },
        (error) => {
          throw error;
        }
      );
  } catch (error) {
    console.log('(asyncUpdateExchangeEvent) Error: ', error);
    throw error;
  }
};

export const asyncDeleteExchangeEvent = async (singleAppointment, user, callback) => {
  try {
    return await singleAppointment.Delete(DeleteMode.MoveToDeletedItems).then(
      async (success) => {
        const db = await getDb();
        const query = db.events
          .find()
          .where('originalId')
          .eq(singleAppointment.Id.UniqueId);
        await query.remove();
        const data = await db.events.find().exec();
        // console.log(data);
        // console.log(DateTime.Now, DateTime.UtcNow);
        callback();
        return deleteEventSuccess(singleAppointment.Id.UniqueId, user);
      },
      (error) => {
        console.log('error:', error);
        throw error;
      }
    );
  } catch (error) {
    console.log('(asyncDeleteExchangeEvent) Error: ', error);
    throw error;
  }
};

export const asyncGetRecurrAndSingleExchangeEvents = async (exch) => {
  const exchangeEvents = await asyncGetAllExchangeEvents(exch);

  const arrayOfNonRecurrIds = [];
  const mapOfRecurrEvents = new Map();
  exchangeEvents.forEach((event) => {
    if (event.AppointmentType === 'Single') {
      arrayOfNonRecurrIds.push(new ItemId(event.Id.UniqueId));
    } else {
      let arrayOfRecurrIds = mapOfRecurrEvents.get(event.ICalUid);
      if (arrayOfRecurrIds === undefined) {
        arrayOfRecurrIds = [];
      }

      arrayOfRecurrIds.push(event);
      mapOfRecurrEvents.set(event.ICalUid, arrayOfRecurrIds);
    }
  });

  const exchangeEventsWithBody = await asyncGetExchangeBodyEvents(
    exch,
    arrayOfNonRecurrIds,
    exchangeEvents
  );

  const recurrMasterEvents = await asyncGetExchangeRecurrMasterEvents(exch);
  for (const [key, value] of mapOfRecurrEvents) {
    const recurrMasterId = recurrMasterEvents.get(key).Id;
    value.forEach((event) => (event.RecurrenceMasterId = recurrMasterId));
    exchangeEventsWithBody.push(...value);
  }

  console.log(exchangeEventsWithBody);
  return exchangeEventsWithBody;
};

const asyncGetAllExchangeEvents = async (exch) => {
  let view;
  let exchangeEvents = [];
  const results = [];

  function loopEvents(response) {
    exchangeEvents = exchangeEvents.concat(response.Items);
  }

  const a = moment.unix(1451653200).add(23, 'month');
  let prev = moment.unix(1451653200);
  const b = moment.unix(1704114000); // Just some random super large time.

  for (let m = moment(a); m.isBefore(b); m.add(23, 'month')) {
    view = new CalendarView(new DateTime(prev), new DateTime(m));
    try {
      results.push(
        exch.FindAppointments(WellKnownFolderName.Calendar, view).then(
          (response) => loopEvents(response),
          (error) => {
            throw error;
          }
        )
      );
    } catch (error) {
      throw error;
    }
    prev = prev.add(23, 'month');
  }
  await Promise.all(results);
  return exchangeEvents;
};

const asyncGetExchangeBodyEvents = async (exch, arrayOfNonRecurrIds, exchangeEvents) => {
  const exchangeEventsWithBody = [];
  const additonalProps = new PropertySet(BasePropertySet.IdOnly, ItemSchema.Body);
  additonalProps.RequestedBodyType = BodyType.Text;

  await exch.BindToItems(arrayOfNonRecurrIds, additonalProps).then(
    (resp) => {
      resp.responses.forEach((singleAppointment) => {
        const fullSizeAppointment = exchangeEvents.filter(
          (event) => event.Id.UniqueId === singleAppointment.item.Id.UniqueId
        )[0];
        fullSizeAppointment.Body = singleAppointment.item.Body.text;
        exchangeEventsWithBody.push(fullSizeAppointment);
      });
    },
    (error) => {
      console.log(error); // I got ECONNRESET or something the last time, idk how to break this so that I can ensure stability, figure out later.
      throw error;
    }
  );

  return exchangeEventsWithBody;
};

const asyncGetExchangeRecurrMasterEvents = async (exch) => {
  let view;
  const exchangeEvents = new Map();
  const results = [];

  try {
    await exch
      .FindItems(WellKnownFolderName.Calendar, new ItemView(100))
      .then((resp) => resp.Items.filter((item) => item.AppointmentType === 'RecurringMaster'))
      .then((recurringMasterEvents) => {
        const setKeyId = new Set();
        recurringMasterEvents.forEach((item) => setKeyId.add(new ItemId(item.Id.UniqueId)));

        const additonalProps = new PropertySet(BasePropertySet.IdOnly, [
          AppointmentSchema.Recurrence,
          AppointmentSchema.Body,
          AppointmentSchema.Subject,
          AppointmentSchema.AppointmentType,
          AppointmentSchema.IsRecurring,
          AppointmentSchema.Start,
          AppointmentSchema.End,
          AppointmentSchema.ICalUid,
          AppointmentSchema.ICalRecurrenceId,
          AppointmentSchema.LastOccurrence,
          AppointmentSchema.ModifiedOccurrences,
          AppointmentSchema.DeletedOccurrences
        ]);
        additonalProps.RequestedBodyType = BodyType.Text;

        const promiseArr = [];
        if (setKeyId.size > 0) {
          promiseArr.push(exch.BindToItems([...setKeyId], additonalProps));
        }
        return Promise.all(promiseArr);
      })
      .then((recurrence) => {
        if (recurrence.length > 0) {
          recurrence[0].Responses.map((resp) => resp.Item).forEach((event) =>
            exchangeEvents.set(event.ICalUid, event)
          );
        }
      });
  } catch (error) {
    console.log(error);
  }

  // console.log(exchangeEvents, results);
  await Promise.all(results);
  return exchangeEvents;
};

const parseEwsRecurringPatterns = (id, ewsAppointment) => ({
  id: uniqid(),
  originalId: id,
  freq: parseEwsFreq(ewsAppointment.XmlElementName),
  interval: parseInt(ewsAppointment.Interval, 10),
  recurringTypeId: ewsAppointment.StartDate.getMomentDate().format('YYYY-MM-DDTHH:mm:ssZ'),
  until: ewsAppointment.EndDate.getMomentDate().format('YYYY-MM-DDTHH:mm:ssZ'),
  // TO-DO, actually populate this properly.
  exDates: [],
  recurrenceIds: [],
  modifiedThenDeleted: false
});

const parseEwsFreq = (ewsAppointmentPattern) => {
  switch (ewsAppointmentPattern) {
    case 'DailyRecurrence':
      return 'DAILY';
    case 'AbsoluteMonthlyRecurrence':
      return 'MONTHLY';
    case 'RelativeMonthlyRecurrence':
      return 'MONTHLY';
    case 'RelativeYearlyRecurrence':
      return 'YEARLY';
    case 'WeeklyRecurrence':
      return 'WEEKLY';
    case 'AbsoluteYearlyRecurrence':
      return 'YEARLY';
    default:
      break;
  }
};
