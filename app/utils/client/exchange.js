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
  DeleteMode
} from 'ews-javascript-api';
import moment from 'moment';
import * as ProviderTypes from '../constants';

import getDb from '../../db';

export const filterExchangeUser = jsonObj => ({
  personId: md5(jsonObj.username),
  originalId: jsonObj.username,
  email: jsonObj.username,
  providerType: ProviderTypes.EXCHANGE,
  password: jsonObj.password
});

async function asyncExchangeRequest(username, password, url) {
  const exch = new ExchangeService();
  exch.Url = new Uri(url);

  exch.Credentials = new ExchangeCredentials(username, password);
  const a = moment.unix(1451653200).add(23, 'month');
  let prev = moment.unix(1451653200);
  const b = moment.unix(1704114000); // 1/1/2099 1am , just some random super large time.

  let view;
  let exchangeEvents = [];

  function loopEvents(response) {
    exchangeEvents = exchangeEvents.concat(response.Items);
  }

  console.log('Started exchange sync');
  const results = [];
  // If you want an exclusive end date (half-open interval)
  for (let m = moment(a); m.isBefore(b); m.add(23, 'month')) {
    view = new CalendarView(new DateTime(prev), new DateTime(m));
    results.push(
      exch.FindAppointments(WellKnownFolderName.Calendar, view).then(
        response => loopEvents(response),
        error => {
          console.log(error);
        }
      )
    );
    // console.log(value);
    prev = prev.add(23, 'month');
  }
  await Promise.all(results);
  console.log('Finished exchange sync');
  // console.log(exchangeEvents);

  const arrayOfIdAndChangekey = [];
  const arrayOfIds = [];
  exchangeEvents.forEach(event => {
    arrayOfIdAndChangekey.push({
      Id: event.Id.UniqueId,
      ChangeKey: event.Id.Changekey
    });
    arrayOfIds.push(new ItemId(event.Id.UniqueId));
  });

  const additonalProps = new PropertySet(
    BasePropertySet.IdOnly,
    ItemSchema.Body
  );
  additonalProps.RequestedBodyType = BodyType.Text;

  const exchangeEventsWithBody = [];

  await exch.BindToItems(arrayOfIds, additonalProps).then(
    resp => {
      resp.responses.forEach(singleAppointment => {
        const fullSizeAppointment = exchangeEvents.filter(
          event => event.Id.UniqueId === singleAppointment.item.Id.UniqueId
        )[0];
        fullSizeAppointment.Body = singleAppointment.item.Body.text;
        exchangeEventsWithBody.push(fullSizeAppointment);
      });
    },
    error => {
      console.log(error);
    }
  );
  return exchangeEventsWithBody;
}

export const getAllEvents = (username, password, url) =>
  asyncExchangeRequest(username, password, url);

export const createEvent = async (username, password, url, payload) => {
  const exch = new ExchangeService();
  exch.Url = new Uri(url);
  exch.Credentials = new ExchangeCredentials(username, password);

  const newEvent = new Appointment(exch);

  newEvent.Subject = payload.summary;
  newEvent.Body = new MessageBody('');
  newEvent.Start = new DateTime(
    moment.tz(payload.start.dateTime, payload.start.timezone)
  );
  newEvent.End = new DateTime(
    moment.tz(payload.end.dateTime, payload.end.timezone)
  );
  newEvent
    .Save(
      WellKnownFolderName.Calendar,
      SendInvitationsMode.SendToAllAndSaveCopy
    )
    .then(
      async () => {
        const db = await getDb();
        const doc = await db.events.upsert(
          ProviderTypes.filterIntoSchema(
            newEvent,
            ProviderTypes.EXCHANGE,
            username
          )
        );
      },
      error => console.log(error)
    );
};

export const findSingleEventById = async (username, password, url, itemId) => {
  const exch = new ExchangeService();
  exch.Url = new Uri(url);
  exch.Credentials = new ExchangeCredentials(username, password);

  const appointment = await Appointment.Bind(exch, new ItemId(itemId));
  return appointment;
};

export const asyncDeleteSingleEventById = async (
  username,
  password,
  url,
  itemId
) => {
  const exch = new ExchangeService();
  exch.Url = new Uri(url);
  exch.Credentials = new ExchangeCredentials(username, password);

  const item = await Appointment.Bind(exch, new ItemId(itemId));
  await item.Delete(DeleteMode.MoveToDeletedItems);
};
