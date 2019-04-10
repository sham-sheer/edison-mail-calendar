import React from 'react';
import M from 'materialize-css';

export default const titleBox = ({ end }) => {
  return(
    <div>
      <input type="text" class="datepicker" defaultDate={end}>
      <input type="text" class="timepicker" defaultTime='now'>
    </div>
  )
  )
}
