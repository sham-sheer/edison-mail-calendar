import React, { Component } from 'react';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import MomentLocaleUtils, { formatDate, parseDate } from 'react-day-picker/moment';
import 'react-day-picker/lib/style.css';
import moment from 'moment';

class Date extends Component {
  handleClickDay = (day) => {
    const momentDay = moment(day).format();
    this.props.dayProps({
      name: this.props.name,
      value: momentDay
    });
  }


  render() {

    return(
      <div>
        <DayPickerInput
          formatDate={formatDate}
          parseDate={parseDate}
          format="LL"
          onDayChange={this.handleClickDay}
          placeholder={`${formatDate(this.props.startDay)}`}
          dayPickerProps={{
            locale: 'it',
            localeUtils: MomentLocaleUtils,
          }}
        />
      </div>
    );
  }
}

export default Date;
