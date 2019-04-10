import React, { Component } from 'react';
import SearchBox from './search-box';
import Select from 'react-select';

class Attendees extends React.Component {
  state = {
    attendees: [],
    attendee: ''
  }

  componentDidUpdate(prevProps) {
    if(this.props.attendees !== prevProps.attendees
      && this.props.attendees !== undefined) {
      this.setState({
        attendees: this.props.attendees,
      })
    }
  }

  handleSelectChange = async (attendee) => {
    this.setState({ attendee });
    this.props.onAttendeeChanged({
      name: this.props.name,
      value: attendee
    });
  }

  render() {
    let input = this.state.attendees.map(attendee => {
      const email = attendee.email;
      return (
        <li>
          <span>{email}</span>
          <button onClick={() => this.removeAttendee(email)}>Remove</button>
        </li>
      )
    })
    const options = [
      { value: 'shamsheer619@gmail.com', label: 'shamsheer619@gmail.com' },
      { value: 'sameenhaja@yahoo.com.sg', label: 'sameenhaja@yahoo.com.sg' },
      { value: 'shuhao@edison.tech', label: 'shuhao@edison.tech' }
    ];
    const defaultList = this.state.attendees.map((attendee) => {
      return {
        value: attendee.email,
        label: attendee.email
      }
    })
    return (
      <div>
        <h5>Attendees</h5>
        <Select
         isMulti
         value={this.state.attendee}
         options={options}
         onChange={this.handleSelectChange}
         defaultValue={defaultList}
         />
      </div>
    )
  }
}

export default Attendees;
