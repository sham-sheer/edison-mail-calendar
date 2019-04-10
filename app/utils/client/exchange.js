import md5 from 'md5';
import * as ProviderTypes from '../constants';
import { ExchangeService, DateTime, Uri, WellKnownFolderName, CalendarView, ExchangeCredentials, Appointment, SendInvitationsMode, Item, PropertySet, ItemSchema, ConflictResolutionMode, SendInvitationsOrCancellationsMode, MessageBody, ItemId, BasePropertySet, ExtendedPropertyDefinition, BodyType, PropertyDefinitionBase } from 'ews-javascript-api';
import moment from "moment";

import getDb from '../../db'

export const filterExchangeUser = (jsonObj) => {
  return {
    personId: md5(jsonObj.username),
    originalId: jsonObj.username,
    email: jsonObj.username,
    providerType: ProviderTypes.EXCHANGE,
    password: jsonObj.password,
  };
};

async function asyncExchangeRequest (username, password, url) {
  let exch = new ExchangeService();
  exch.Url = new Uri(url);

  exch.Credentials = new ExchangeCredentials(username, password);
  var a = moment.unix(1451653200).add(23, "month");
  var prev = moment.unix(1451653200);;
  var b = moment.unix(1704114000);      // 1/1/2099 1am , just some random super large time.

  var view;
  var exchangeEvents = [];

  function loopEvents (response) {
    exchangeEvents = exchangeEvents.concat(response.Items);
  }

  console.log("Started exchange sync");
  // If you want an exclusive end date (half-open interval)
  for (var m = moment(a); m.isBefore(b); m.add(23, "month")) {
    view = new CalendarView(new DateTime(prev), new DateTime(m));
    await exch.FindAppointments(WellKnownFolderName.Calendar, view).then((response) => loopEvents(response), function (error) {
      console.log(error);
    });
    // console.log(value);
    prev = prev.add(23, "month")
  }
  console.log("Finished exchange sync");
  // console.log(exchangeEvents);

  var arrayOfIdAndChangekey = [];
  var arrayOfIds = [];
  exchangeEvents.map((event) => {
    arrayOfIdAndChangekey.push({ Id: event.Id.UniqueId, ChangeKey: event.Id.Changekey });
    arrayOfIds.push(new ItemId(event.Id.UniqueId));
  });

  var additonalProps = new PropertySet(BasePropertySet.IdOnly, ItemSchema.Body);
  additonalProps.RequestedBodyType = BodyType.Text;

  var exchangeEventsWithBody = [];

  await exch.BindToItems(arrayOfIds, additonalProps).then(resp => {
    resp.responses.map(singleAppointment => {
      var fullSizeAppointment = exchangeEvents.filter((event) => event.Id.UniqueId === singleAppointment.item.Id.UniqueId)[0];
      fullSizeAppointment.Body = singleAppointment.item.Body.text;
      exchangeEventsWithBody.push(fullSizeAppointment);
    })
  }, error => {
    console.log(error);
  })
  
  // console.log(exchangeEventsWithBody);
  return exchangeEventsWithBody;
}

export const getAllEvents = (username, password, url) => {
  return asyncExchangeRequest(username, password, url);
}

async function asyncCreateEvent (username, password, url, payload) {
  console.log(username, password, url, payload);

  let exch = new ExchangeService();
  exch.Url = new Uri(url);
  exch.Credentials = new ExchangeCredentials(username, password);

  let newEvent = new Appointment(exch);

  newEvent.Subject = payload.summary;
  newEvent.Body = new MessageBody("");
  newEvent.Start = new DateTime(moment.tz(payload.start.dateTime,payload.start.timezone));
  newEvent.End = new DateTime(moment.tz(payload.end.dateTime,payload.end.timezone));
  newEvent.Save(WellKnownFolderName.Calendar,SendInvitationsMode.SendToAllAndSaveCopy).then(
    async () => {
      const db = await getDb();
      const doc = await db.events.upsert(ProviderTypes.filterIntoSchema(newEvent,ProviderTypes.EXCHANGE, username));
    }, 
    (error) => console.log(error)
    );
}

export const createEvent = (username, password, url, payload) => {
  return asyncCreateEvent(username, password, url, payload);
}

async function asyncFindSingleEventById (username, password, url, itemId) {
  let exch = new ExchangeService();
  exch.Url = new Uri(url);
  exch.Credentials = new ExchangeCredentials(username, password);

  return await Appointment.Bind(exch, new ItemId(itemId));
}

export const findSingleEventById = (username, password, url, itemId) => {
  return asyncFindSingleEventById (username, password, url, itemId);
}