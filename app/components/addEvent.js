import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import { FormControl } from 'react-bootstrap';
import moment from 'moment';

const START_INDEX_OF_UTC_FORMAT = 17;
const START_INDEX_OF_HOUR = 11;
const END_INDEX_OF_HOUR = 13;
const TIME_OFFSET = 12;
const START_INDEX_OF_DATE = 0;
const END_INDEX_OF_DATE = 11;
const END_INDEX_OF_MINUTE = 16;

export default class AddEvent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: '',
      desc: '',
      startParsed: '',
      endParsed: '',
      start: '',
      end: '',
      selectedProvider: ''
    };
  }

  componentWillMount() {
    const { props } = this;

    const startDateParsed = moment(props.match.params.start).format(
      'YYYY-MM-DDThh:mm a'
    );
    const endDateParsed = moment(props.match.params.end).format(
      'YYYY-MM-DDThh:mm a'
    );
    console.log(props.match.params.end);
    const startDateParsedInUTC = this.processStringForUTC(startDateParsed);
    const endDateParsedInUTC = this.processStringForUTC(endDateParsed);
    console.log(
      `${moment(startDateParsedInUTC).format()} ${endDateParsedInUTC}`
    );
    this.setState({
      startParsed: startDateParsedInUTC,
      endParsed: endDateParsedInUTC,
      start: props.match.params.start,
      end: props.match.params.end
    });
  }

  processStringForUTC = dateInString => {
    let dateInStringInUTC;
    if (dateInString.substring(START_INDEX_OF_UTC_FORMAT) === 'pm') {
      const hourInString = parseInt(
        dateInString.substring(START_INDEX_OF_HOUR, END_INDEX_OF_HOUR),
        10
      );
      const hourInStringInUTC = hourInString + TIME_OFFSET;
      console.log(hourInStringInUTC.toString());
      dateInStringInUTC =
        dateInString.substring(START_INDEX_OF_DATE, END_INDEX_OF_DATE) +
        hourInStringInUTC.toString() +
        dateInString.substring(END_INDEX_OF_HOUR, END_INDEX_OF_MINUTE);
    } else {
      dateInStringInUTC = dateInString.substring(
        START_INDEX_OF_DATE,
        END_INDEX_OF_MINUTE
      );
    }
    return dateInStringInUTC;
  };

  handleTitleChange = e => {
    this.setState({ title: e.target.value });
  };

  handleDescChange = e => {
    this.setState({ desc: e.target.value });
  };

  handleChangeStartTime = e => {
    this.setState({ startParsed: e.target.value });
  };

  handleChangeEndTime = e => {
    this.setState({ endParsed: e.target.value });
  };

  handleSubmit = async e => {
    // need to write validation method
    e.preventDefault();
    const { props, state } = this;

    if (state.selectedProvider !== '') {
      const { providerType } = JSON.parse(state.selectedProvider);

      props.postEventBegin(
        {
          summary: state.title,
          description: state.desc,
          start: {
            dateTime: moment(state.startParsed).format(),
            timezone: 'America/Los_Angeles'
          },
          end: {
            dateTime: moment(state.endParsed).format(),
            timezone: 'America/Los_Angeles'
          }
        },
        JSON.parse(state.selectedProvider),
        providerType
      );
      props.history.push('/');
    } else {
      console.log('No provider selected! Disabled adding of events!!');
    }
  };

  handleProvider = e => {
    this.setState({ selectedProvider: e.target.value });
  };

  render() {
    const providers = [];
    const { props, state } = this;
    for (const providerIndivAccount of Object.keys(props.providers)) {
      props.providers[providerIndivAccount].map(data => providers.push(data));
    }

    return (
      <div className="form-event-container">
        <form className="container" onSubmit={this.handleSubmit} noValidate>
          {/* Title Form */}
          <FormControl
            type="text"
            value={state.value}
            placeholder="Enter title of Event"
            onChange={this.handleTitleChange}
          />

          {/* Text Area */}
          <FormControl
            componentClass="textarea"
            placeholder="Description"
            onChange={this.handleDescChange}
          />

          {/* Start Time and Date */}
          <TextField
            id="datetime-local"
            label="Start"
            type="datetime-local"
            defaultValue={state.startParsed}
            className="textField"
            InputLabelProps={{
              shrink: true
            }}
            onChange={this.handleChangeStartTime}
          />

          {/* End Time and Date */}
          <TextField
            id="datetime-local"
            label="End"
            type="datetime-local"
            defaultValue={state.endParsed}
            className="textField"
            InputLabelProps={{
              shrink: true
            }}
            onChange={this.handleChangeEndTime}
          />

          <TextField
            id="standard-select-currency-native"
            select
            label="Select email"
            value={state.selectedProvider}
            onChange={this.handleProvider}
            helperText="Please select which provider"
            margin="normal"
          >
            {providers.map(option => (
              // Currently an issue: https://github.com/mui-org/material-ui/issues/10845
              <MenuItem key={option.personId} value={JSON.stringify(option)}>
                {option.email}
              </MenuItem>
            ))}
          </TextField>

          <input type="submit" value="Submit" />
        </form>
      </div>
    );
  }
}
