import React from 'react';
// import M from 'materialize-css';

const titleBox = ({ end }) => (
  <div>
    <input type="text" className="datepicker" defaultDate={end} />
    <input type="text" className="timepicker" defaultTime="now" />
  </div>
);

export default titleBox;
