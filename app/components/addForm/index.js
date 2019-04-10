import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import { FormControl } from 'react-bootstrap';
import moment from "moment";
import DescBox from "./descBox";
import EndTime from "./endTime";
import StartTime from "./startTime";
import SummaryBox from "./summaryBox";

const START_INDEX_OF_UTC_FORMAT = 17;
const START_INDEX_OF_HOUR = 11;
const END_INDEX_OF_HOUR = 13;
const TIME_OFFSET = 12;
const START_INDEX_OF_DATE = 0;
const END_INDEX_OF_DATE = 11;
const END_INDEX_OF_MINUTE = 16;

export default class AddEvent extends Component {
  handleSubmit = async (e) => {
    // need to write validation method
    e.preventDefault();
    this.props.history.push('/');
  }

  render() {
    return (
      <div className="form-event-container">
        <form className="container" onSubmit={this.handleSubmit} noValidate>

          <Summary />
          <StartTime />
          <EndTime />
          <Description />

          <input type="submit" value="Submit" />
        </form>
      </div>


    );
  }
}
