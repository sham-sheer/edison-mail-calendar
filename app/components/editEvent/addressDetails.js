import React from 'react';

const AddressDetails = props => {
  return (
      <div>
        <pre>{JSON.stringify(props.place, null, 2)}</pre>
        </div>
      )
 }

 export default AddressDetails;
