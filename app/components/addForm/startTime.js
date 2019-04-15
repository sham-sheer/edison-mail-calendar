import React from 'react';
// import M from 'materialize-css';

const titleBox = ({ start }) => (
  <div>
    <input type="text" className="datepicker" defaultDate={start} />
    <input type="text" className="timepicker" defaultTime="now" />
  </div>
);

export default titleBox;
