import { dropDownTime } from '../../utils/constants';
import React, { Component } from 'react';
import Select from 'react-select';
import './time.css';

class Time extends Component {
  handleSelectChange = (time) => {
    this.props.timeProps({
      name: this.props.name,
      value: time.value
    });
  }


  render() {
    const currentTimeObj = {
      value: this.props.currentTime,
      label: this.props.currentTime,
    }
    return(
      <div >
        <Select
          value={currentTimeObj}
          options={this.props.dropDownTime}
          onChange={this.handleSelectChange}
        />
      </div>
    );
  }
}

export default Time;
