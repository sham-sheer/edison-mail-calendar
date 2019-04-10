/* global google */

import React from "react";
import AddressDetails from './addressDetails';
class Location extends React.Component {
  constructor(props) {
    super(props);
    this.autocompleteInput = React.createRef();
    this.autocomplete = null;
    this.handlePlaceChanged = this.handlePlaceChanged.bind(this);
    this.state = {
      place: ''
    }
  }

  componentDidMount() {
    this.autocomplete = new google.maps.places.Autocomplete(
      this.autocompleteInput.current,
      { types: ["geocode"] }
    );
    this.autocomplete.setFields(['address_component', 'geometry', 'icon', 'name']);
    this.autocomplete.addListener("place_changed", this.handlePlaceChanged);
    this.setState({
      place: this.props.place
    })
  }

  handlePlaceChanged() {
    const place = this.autocomplete.getPlace();
    this.props.onPlaceChanged({
      name: this.props.name,
      value: place
    });
  }

  render() {
    return (
      <div>
      <h5>Location</h5>
      <input
        ref={this.autocompleteInput}
        id="autocomplete"
        placeholder="Enter your address"
        type="text"
      />
      <AddressDetails place={this.state.place} />
      </div>
    );
  }
}

export default Location;
