import React, { Component } from 'react';
import BigCalendar from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import Modal from 'react-modal';
import './view.css';
import {
  // ExchangeVersion,
  ExchangeService,
  // DateTime,
  // WebCredentials,
  Uri,
  // WellKnownFolderName,
  // CalendarView,
  // SearchFilter,
  // FolderSchema,
  // FolderView,
  ExchangeCredentials,
  // WindowsLiveCredentials,
  // ClientCertificateCredentials,
  // PartnerTokenCredentials,
  // WSSecurityBasedCredentials,
  // X509CertificateCredentials,
  // TokenCredentials,
  // OAuthCredentials,
  // CalendarFolder,
  // Appointment,
  // SendInvitationsMode,
  // ConflictResolutionMode,
  // SendInvitationsOrCancellationsMode,
  // ItemId,
  // FolderId,
  // Folder,
  // Mailbox,
  // ItemView
  Item,
  PropertySet,
  ItemSchema,
  ItemId,
  DateTime
} from 'ews-javascript-api';

import getDb from '../db';
import * as ProviderTypes from '../utils/constants';
import SignupSyncLink from './SignupSyncLink';

// import { FASTMAIL_USERNAME, FASTMAIL_PASSWORD } from '../utils/Credentials';
// const dav = require('dav');

const localizer = BigCalendar.momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(BigCalendar);

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)'
  }
};

export default class View extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentEvent: [{}],
      isShowEvent: false,
      currentEventStartDateTime: '',
      currentEventEndDateTime: '',
      exchangeEmail: 'e0176993@u.nus.edu',
      exchangePwd: 'Ggrfw4406@nus41'
    };
    let incrementalSync;

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    // For the modal third party library
    Modal.setAppElement('body');
  }

  async componentDidMount() {
    const exch = new ExchangeService();
    exch.Url = new Uri('https://outlook.office365.com/Ews/Exchange.asmx');

    const userName = 'e0176993@u.nus.edu';
    const password = 'Ggrfw4406@nus41';

    exch.Credentials = new ExchangeCredentials(userName, password);

    const { props } = this;

    props.beginPendingActions(props.providers);

    // try {
    //   var id = new FolderId(WellKnownFolderName.Calendar, new Mailbox(userName));
    //   let targetFolder = Folder.Bind(exch, id).then(
    //     resp => console.log(resp),
    //     error => console.log("Inside error:", error)
    //   );
    // } catch (e){
    //   console.log("Error: ",e);
    // }

    // // -------------------------------- This code test the finding of multiple calendars --------------------------------
    // try {
    //   exch.FindFolders(WellKnownFolderName.Calendar, new FolderView(100)).then(
    //     // resp => resp.folders.map(folder => console.log(folder)),
    //     resp => resp.folders.map(folder => {
    //       folder.FindItems(new ItemView(folder.TotalCount > 0 ? folder.TotalCount : 1)).then(
    //         resp => {
    //           console.log(folder.Id.UniqueId, folder.DisplayName, resp.items, resp.totalCount);

    //           // Here, we need to do some processing so that it can update on success, but not an issue really.
    //           // I can parse the information into the calendar, but like, how to differciate it is a different question.
    //         },
    //         err => console.log(err)
    //       )
    //     }),
    //     err => console.log(err)
    //   )

    // } catch (e) {
    //   console.log("e: ", e);
    // }
    // // -------------------------------- This code test the finding of multiple calendars --------------------------------

    /*
      TESTING OF LOGGING IN WITH ALL SERVICES.
      // let exch = new ExchangeService();
      // exch.Url = new Uri("https://outlook.office365.com/Ews/Exchange.asmx");

      // // let userName = "shuhao";
      // // let password = "Edo13579";aa

      // let userName = "e0176993@u.nus.edu";
      // let password = "Ggrfw4406@nus41";

      // // exch.Credentials = new ClientCertificateCredentials(userName, password);
      // // var view = new CalendarView(DateTime.Now.Add(-23, "month"), DateTime.Now);
      // // exch.FindAppointments(WellKnownFolderName.Calendar, view).then((response) => {
      // //   console.log(response.Items);
      // // }, function (error) {
      // //   console.log(error);
      // // });

      // exch.Credentials = new ExchangeCredentials(userName, password);
      // var a = moment.unix(0).add(23, "month");
      // var prev = moment.unix(0);;
      // var b = moment.unix(1893459600);      // 1/1/2099 1am , just some random super large time.

      // var view;
      // var exchangeEvents = [];

      // function loopEvents (response) {
      //   exchangeEvents = exchangeEvents.concat(response.Items);
      // }

      // console.log("Started exchange sync");
      // // If you want an exclusive end date (half-open interval)
      // for (var m = moment(a); m.isBefore(b); m.add(23, "month")) {
      //   view = new CalendarView(new DateTime(prev), new DateTime(m));
      //   await exch.FindAppointments(WellKnownFolderName.Calendar, view).then((response) => loopEvents(response), function (error) {
      //     console.log(error);
      //   });
      //   prev = prev.add(23, "month")
      // }
      // console.log("Finished exchange sync");
      // console.log(exchangeEvents);

      // exch.Credentials = new PartnerTokenCredentials(userName, password);
      // view = new CalendarView(DateTime.Now.Add(-23, "month"), DateTime.Now);
      // exch.FindAppointments(WellKnownFolderName.Calendar, view).then((response) => {
      //   console.log(response.Items);
      // }, function (error) {
      //   console.log(error);
      // });

      // exch.Credentials = new TokenCredentials(userName, password);
      // view = new CalendarView(DateTime.Now.Add(-23, "month"), DateTime.Now);
      // exch.FindAppointments(WellKnownFolderName.Calendar, view).then((response) => {
      //   console.log(response.Items);
      // }, function (error) {
      //   console.log(error);
      // });

      // exch.Credentials = new WSSecurityBasedCredentials(userName, password);
      // view = new CalendarView(DateTime.Now.Add(-23, "month"), DateTime.Now);
      // exch.FindAppointments(WellKnownFolderName.Calendar, view).then((response) => {
      //   console.log(response.Items);
      // }, function (error) {
      //   console.log(error);
      // });

      // exch.Credentials = new WebCredentials(userName, password);
      // view = new CalendarView(DateTime.Now.Add(-23, "month"), DateTime.Now);
      // exch.FindAppointments(WellKnownFolderName.Calendar, view).then((response) => {
      //   console.log(response.Items);
      // }, function (error) {
      //   console.log(error);
      // });

      // exch.Credentials = new WindowsLiveCredentials(userName, password);
      // view = new CalendarView(DateTime.Now.Add(-23, "month"), DateTime.Now);
      // exch.FindAppointments(WellKnownFolderName.Calendar, view).then((response) => {
      //   console.log(response.Items);
      // }, function (error) {
      //   console.log(error);
      // });


      // exch.Credentials = new X509CertificateCredentials(userName, password);
      // var view = new CalendarView(DateTime.Now.Add(-23, "month"), DateTime.Now);
      // exch.FindAppointments(WellKnownFolderName.Calendar, view).then((response) => {
      //   console.log(response.Items);
      // }, function (error) {
      //   console.log(error);
      // });
    */

    const db = await getDb();

    // const eventsz = await db.events.find().exec();
    // console.log(eventsz);
    // const actions = await db.pendingactions.find().exec();
    // console.log(actions);

    db.persons
      .find()
      .exec()
      .then(providerUserData => {
        providerUserData.forEach(singleProviderUserData => {
          if (singleProviderUserData.providerType === ProviderTypes.EXCHANGE) {
            // Might wanna rethink this approach as it might be good for some clean up here.
            props.onStartGetExchangeAuth(
              this.filterUserOnStart(
                singleProviderUserData,
                ProviderTypes.EXCHANGE
              )
            );
          } else {
            const now = new Date().getTime();
            const isExpired =
              now > parseInt(singleProviderUserData.accessTokenExpiry, 10);

            // console.log(singleProviderUserData,this.filterUserOnStart(singleProviderUserData,ProviderTypes.GOOGLE));
            // console.log(now,singleProviderUserData.accessTokenExpiry,isExpired,providerUserData);
            // console.log(singleProviderUserData.providerType + " is " + (isExpired ? "expired!" : "not expired!"));

            if (!isExpired) {
              switch (singleProviderUserData.providerType) {
                case ProviderTypes.GOOGLE:
                  props.onStartGetGoogleAuth(
                    this.filterUserOnStart(
                      singleProviderUserData,
                      ProviderTypes.GOOGLE
                    )
                  );
                  break;
                case ProviderTypes.OUTLOOK:
                  props.onStartGetOutlookAuth(
                    this.filterUserOnStart(
                      singleProviderUserData,
                      ProviderTypes.OUTLOOK
                    )
                  );
                  break;
                default:
                  break;
              }
            } else {
              switch (singleProviderUserData.providerType) {
                case ProviderTypes.GOOGLE:
                  props.onExpiredGoogle(
                    this.filterUserOnStart(
                      singleProviderUserData,
                      ProviderTypes.GOOGLE
                    )
                  );
                  break;
                case ProviderTypes.OUTLOOK:
                  props.onExpiredOutlook(
                    this.filterUserOnStart(
                      singleProviderUserData,
                      ProviderTypes.OUTLOOK
                    )
                  );
                  break;
                default:
                  break;
              }
            }
          }
        });
      });
  }

  componentWillUnmount() {
    clearInterval(this.incrementalSync);
    this.incrementalSync = null;
  }

  authorizeOutLookCodeRequest = () => {
    const { props } = this;
    props.beginOutlookAuth();
  };

  authorizeGoogleCodeRequest = () => {
    const { props } = this;
    props.beginGoogleAuth();
  };

  authorizeExchangeCodeRequest = (user, pwd) => {
    const { props } = this;
    props.beginExchangeAuth(user, pwd);
  };

  // Calendar Event Functions
  moveEventList = ({ event, start, end }) => {
    const { events } = this.props;
    const { props } = this;

    const idx = events.indexOf(event);
    const updatedEvent = { ...event, start, end };

    const nextEvents = [...events];
    nextEvents.splice(idx, 1, updatedEvent);
    props.updateEvents(nextEvents);
  };

  resizeEvent = (resizeType, { event, start, end }) => {
    const { events } = this.props;
    const { props } = this;

    const nextEvents = events.map(existingEvent =>
      existingEvent.id === event.id
        ? { ...existingEvent, start, end }
        : existingEvent
    );
    props.updateEvents(nextEvents);
  };

  handleSelectDate = ({ start, end }) => {
    const { props } = this;
    props.history.push(`/${start}/${end}`);
  };

  editEvent = () => {
    const { props } = this;
    const { state } = this;
    props.history.push(`/${state.currentEvent.id}`);
  };

  handleEventClick = event => {
    this.setState({
      isShowEvent: true,
      currentEvent: event,
      currentEventStartDateTime: moment(event.start).format(
        'D, MMMM YYYY, h:mm a'
      ),
      currentEventEndDateTime: moment(event.end).format(
        'D, MMMM Do YYYY, h:mm a'
      )
    });
  };

  // Exchange login handling here first, will move it in the future!!
  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = async e => {
    e.preventDefault();
    const { state } = this;
    this.authorizeExchangeCodeRequest({
      username: state.exchangeEmail,
      password: state.exchangePwd
    });
  };

  // This filter user is used when the outlook first creates the object.
  // It takes the outlook user object, and map it to the common schema defined in db/person.js
  filterUserOnStart = (rxDoc, providerType) => ({
    user: {
      personId: rxDoc.personId,
      originalId: rxDoc.originalId,
      email: rxDoc.email,
      providerType,
      accessToken: rxDoc.accessToken,
      accessTokenExpiry: rxDoc.accessTokenExpiry,
      password: rxDoc.password
    }
  });

  closeModal = () => {
    this.setState({
      isShowEvent: false
    });
  };

  deleteEvent = () => {
    const { props } = this;
    const { state } = this;
    props.beginDeleteEvent(state.currentEvent.id);
    this.closeModal();
  };

  /* Render functions */
  renderCalendar = props => {
    const { events } = props;
    return (
      <DragAndDropCalendar
        selectable
        localizer={localizer}
        events={events}
        views={{
          month: true,
          day: true
        }}
        onEventDrop={this.moveEventList}
        onEventResize={this.resizeEvent}
        onSelectSlot={this.handleSelectDate}
        onSelectEvent={event => this.handleEventClick(event)}
        popup
        resizable
      />
    );
  };

  renderEventPopup = state => (
    <Modal
      isOpen={state.isShowEvent}
      onAfterOpen={this.afterOpenModal}
      onRequestClose={this.closeModal}
      style={customStyles}
      contentLabel="Event Modal"
    >
      <h2 ref={subtitle => (this.subtitle = subtitle)}>
        {state.currentEvent.title}
      </h2>
      <h4>
        {state.currentEventStartDateTime} - {state.currentEventEndDateTime}
      </h4>
      <button type="button" onClick={this.closeModal}>
        Close
      </button>
      <button type="button" onClick={this.deleteEvent}>
        Delete
      </button>
      <button type="button" onClick={this.editEvent}>
        Edit
      </button>
    </Modal>
  );

  renderSignupLinks = (props, state) => {
    const providers = [];
    for (const providerType of Object.keys(props.expiredProviders)) {
      let providerFunc;
      switch (providerType) {
        case ProviderTypes.GOOGLE:
          providerFunc = () => this.authorizeGoogleCodeRequest();
          break;
        case ProviderTypes.OUTLOOK:
          providerFunc = () => this.authorizeOutLookCodeRequest();
          break;
        case ProviderTypes.EXCHANGE:
          // Exchange provider does not expire, I think, so here is empty.
          // If it does expire, write some code here to handle it.
          break;
        default:
          console.log('Provider not accounted for!!');
          break;
      }

      providers.push(
        <SignupSyncLink
          key={providerType}
          providerType={providerType}
          providerInfo={props.expiredProviders[providerType]}
          providerFunc={() => providerFunc()}
        />
      );
    }

    return (
      <div>
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() => props.beginPollingEvents()}
        >
          <i className="material-icons left">close</i>Begin Poll Events
        </a>{' '}
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() => props.endPollingEvents()}
        >
          <i className="material-icons left">close</i>End Poll Events
        </a>{' '}
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() => props.beginPendingActions(props.providers)}
        >
          <i className="material-icons left">close</i>Begin Pending Actions
        </a>{' '}
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() => props.endPendingActions()}
        >
          <i className="material-icons left">close</i>End Pending Actions
        </a>{' '}
        <form onSubmit={this.handleSubmit}>
          <input
            type="text"
            name="exchangeEmail"
            value={state.exchangeEmail}
            onChange={this.handleChange}
            placeholder="Exchange Email"
          />
          <input
            type="text"
            name="exchangePwd"
            value={state.exchangePwd}
            onChange={this.handleChange}
            placeholder="Exchange Password"
          />

          <input type="submit" value="Submit" />
        </form>
        {/* this is for out of sync tokens. */}
        {providers}
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() => this.authorizeGoogleCodeRequest()}
        >
          <i className="material-icons left">cloud</i>Sign in with Google
        </a>
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() => this.authorizeOutLookCodeRequest()}
        >
          <i className="material-icons left">cloud</i>Sign in with Outlook
        </a>
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          // onClick={() => this.props.beginGetGoogleEvents()}>

          // This is suppose to allow us to sync multiple user per single provider in the future!!
          // Currently, due to no UI, I am hardcoding it to a single instance. But once we get the
          // UI up and running for choosing which user events you want to get, this will be amazing
          // Note: This is the same for the following button, which pulls outlook events.

          // Okay, debate later, coz idk how to deal with it when the user signs in, to update this state here.
          onClick={() => props.beginGetGoogleEvents(props.providers.GOOGLE[0])}
        >
          <i className="material-icons left">cloud_download</i>Get Google Events
        </a>
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() =>
            props.beginGetOutlookEvents(props.providers.OUTLOOK[0])
          }
        >
          <i className="material-icons left">cloud_download</i>Get Outlook
          Events
        </a>
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() =>
            props.beginGetExchangeEvents(props.providers.EXCHANGE[0])
          }
        >
          <i className="material-icons left">cloud_download</i>Get Exchange
          Events
        </a>
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() => props.clearAllEvents()}
        >
          <i className="material-icons left">close</i>Clear all Events
        </a>
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() => props.beginRetrieveCalDavEvents()}
        >
          <i className="material-icons left">cloud_download</i>Populate Caldav
        </a>
        <a
          role="button"
          tabIndex="0"
          className="waves-effect waves-light btn"
          onClick={() => props.resetCaldavAccount()}
        >
          <i className="material-icons left">cloud_download</i>Get Caldav
        </a>
      </div>
    );
  };

  render() {
    const { props } = this;
    const { state } = this;
    if (props.isAuth !== undefined) {
      return (
        <div>
          {this.renderSignupLinks(props, state)}
          {this.renderEventPopup(state)}
          {this.renderCalendar(props)}
        </div>
      );
    }
    return <div>Logging in...</div>;
  }
}
