import React, { Component } from 'react';
import Select from 'react-select';

class Conference extends Component {
  handleSelectChange = (conference) => {
    this.props.onConferChanged({
      name: this.props.name,
      value: conference.value
    })
  }
  render() {
    const options = [
      { value: 'Hangouts', label: 'Hangouts' },
      { value: 'No Conferencing', label: 'No Conferencing' },
    ];
    return(
      <div>
        <h5>Conferencing</h5>
        <Select
         value={this.props.conference}
         options={options}
         onChange={this.handleSelectChange}
        />
      </div>
    )
  }
}

export default Conference;
