/* global google */
import React from 'react';
import Location from "./location";
import Attendees from './attendees';
import Date from './date';
import Time from './time';
import Conference from './conference';
import Checkbox from './checkbox';
import getDb from '../../db';
import { loadClient, editGoogleEvent } from '../../utils/client/google';
import { dropDownTime, momentAdd } from '../../utils/constants';
import { findSingleEventById } from '../../utils/client/exchange';
import moment from 'moment';
import './index.css';
/* global google */

import * as ProviderTypes from '../../utils/constants';
import { ConflictResolutionMode, SendInvitationsOrCancellationsMode } from 'ews-javascript-api';

export default class EditEvent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      place: {},
      id: '',
      title: '',
      description: '',
      start: {},
      end: {},
      colorId: '',
      visibility: '',
      attendees: [],
      allDay: false,
      conference: '',
      hangoutLink: '',
      startDay: '',
      endDay: '',
      startTime: '',
      endTime: ''
    };
  }

  componentDidMount() {
    this.retrieveEvent(this.props.match.params.id);
    console.log(this.props);
  }


  //find a way to handle all different inputs
  handleChange = (event) => {
    if(event.target !== undefined) {
      this.setState({
        [event.target.name]: event.target.value
      })
      // if(event.target.checked !== undefined) {
      //   this.setState({ allDay: event.target.checked })
      // } else {
      //   const target = event.target;
      //   const value = target.value;
      //   const name = target.name;
      //   this.setState({
      //     [name]: value
      //   });
      // }
    }
    else {
      this.setState({
        [event.name] : event.value
      })
    }
  }
  handleInputChange = (event) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  handleReactSelect = (event) => {
    this.setState({
      [event.name] : event.value
    })
  }

  handleCheckboxChange = event => {
    this.setState({ allDay: event.target.checked })
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    console.log(this.props);

    switch (this.state.providerType) {
      case ProviderTypes.GOOGLE:
        await loadClient();
        // Error Handling
        const startDateTime = momentAdd(this.state.startDay, this.state.startTime);
        const endDateTime = momentAdd(this.state.endDay, this.state.endTime);

        console.log(startDateTime,endDateTime);

        const attendeeForAPI = this.state.attendees.map(attendee => {
          return {
            email: attendee.value
          }
        })
        let eventPatch = {
          summary: this.state.title,
          start: {
            dateTime: startDateTime
          },
          end: {
            dateTime: endDateTime
          },
          location: this.state.place.name,
          attendees: attendeeForAPI,
        };
        if(this.state.conference.label === 'Hangouts') {
          eventPatch.conferenceData = {
            createRequest: {requestId: "7qxalsvy0e"}
          }
        }
        const editResp = await editGoogleEvent(this.state.id, eventPatch);
        return editResp;
      case ProviderTypes.EXCHANGE:
        let user = this.props.providers.EXCHANGE.filter(object => object.email === this.state.owner)[0];  // this validates which user the event belongs to, by email. 

        var singleAppointment = await findSingleEventById(user.email, user.password, "https://outlook.office365.com/Ews/Exchange.asmx", this.state.id)
        
        singleAppointment.Subject = this.state.title;
        singleAppointment.Location = this.state.place.name;

        singleAppointment.Update(ConflictResolutionMode.AlwaysOverwrite,SendInvitationsOrCancellationsMode.SendToNone).then(async success => {
          const db = await getDb();
          const doc = await db.events.upsert(ProviderTypes.filterIntoSchema(singleAppointment,ProviderTypes.EXCHANGE, user.email));
          this.props.history.push('/');
        }, error => {
          console.log(error);
        });
        break;
      default:
        break;
    }

    // await loadClient();
    // // Error Handling
    // const startDateTime = momentAdd(this.state.startDay, this.state.startTime);
    // const endDateTime = momentAdd(this.state.endDay, this.state.endTime);
    // const attendeeForAPI = this.state.attendees.map(attendee => {
    //   return {
    //     email: attendee.value
    //   }
    // })
    // let eventPatch = {
    //   summary: this.state.title,
    //   start: {
    //     dateTime: startDateTime
    //   },
    //   end: {
    //     dateTime: endDateTime
    //   },
    //   location: this.state.place.name,
    //   attendees: attendeeForAPI,
    // };
    // if(this.state.conference.label === 'Hangouts') {
    //   eventPatch.conferenceData = {
    //     createRequest: {requestId: "7qxalsvy0e"}
    //   }
    // }
    // const editResp = await editGoogleEvent(this.state.id, eventPatch);
    // return editResp;
  }

  // // So the plan here is, 
  // /*
  //   In order to edit a generic event, we have to choose for each individual event.

  //   Google - Retrive ID from our local DB and post with the ID, Google handles everything else
  //   Outlook - Same as google
  //   Exchange - This one requires more thought.
  //     Exchange updates the data different. Not a post request. A function call in the ews-javascript-api call.
  //     Have to think how to call the function when I might not have the object. This means that perhaps I should store the object in the main object.
  //     In order to retrive the event, I need to make a query from the script to get the javascript ews object. However, once I have it, I can update it easily. 
  // */
  retrieveEvent = async (id) => {
    const db = await getDb();
    const dbEvent = await db.events.find().where("id").eq(id).exec();
    const dbEventJSON = dbEvent[0].toJSON();
    console.log(dbEventJSON);

    this.setState({
      id: dbEventJSON.originalId,
      title: dbEventJSON.summary,
      description: dbEventJSON.description,
      start: dbEventJSON.start,
      end: dbEventJSON.end,
      attendees: dbEventJSON.attendees,
      hangoutLink: dbEventJSON.hangoutLink,
      providerType: dbEventJSON.providerType,
      owner: dbEventJSON.owner,
    })
  }

  render() {
    // All Day option will help out here.
    let parseStart = '';
    let parseEnd = '';
    if(this.state.start.dateTime !== undefined) {
      parseStart = this.state.start.dateTime.substring(0, 16);
      parseEnd = this.state.end.dateTime.substring(0, 16);
    } else {
      parseStart = this.state.start.date
      parseEnd = this.state.end.date
    }
    return (
      <div className="edit-container">
       <form
          onSubmit={this.handleSubmit}
          onChange={this.handleChange}
        >
        <input
          name="title"
          type="text"
          defaultValue={this.state.title}
        >
        </input>
        <input
          name="description"
          type="text"
          defaultValue={this.state.description}
          placeholder="Event Description"
        >
        </input>
       <div className="flex-container">
        <Date
          dayProps={this.handleChange}
          name="startDay"
        />
        <Time
          timeProps={this.handleChange}
          currentTime={this.state.startTime}
          name="startTime"
          dropDownTime={dropDownTime('')}
        />
        <span>to</span>
        <Date
          dayProps={this.handleChange}
          name="endDay"
          startDate={this.state.startDay}
        />
        <Time
          timeProps={this.handleChange}
          currentTime={this.state.endTime}
          name="endTime"
          dropDownTime={dropDownTime(this.state.startTime)}
        />
        <div style={{ fontFamily: 'system-ui' }}>
        <label>
          <Checkbox
            checked={this.state.allDay}
            onChange={this.handleChange}
          />
          <span style={{ marginLeft: 8 }}>All Day</span>
        </label>
        </div>
       </div>
       <Location
          onPlaceChanged={this.handleChange.bind(this)}
          place={this.state.place}
          name="place"
       />
       <Attendees
          onAttendeeChanged={this.handleChange.bind(this)}
          attendees={this.state.attendees}
          name="attendees"
       />
       <Conference
          onConferChanged={this.handleChange.bind(this)}
          name="conference"
          conference={this.state.conference}
        />
       <input type="submit" value="Submit"></input>
       </form>
      </div>
    );
  }
}