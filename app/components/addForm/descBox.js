import React from 'react';
// import M from 'materialize-css';

const titleBox = ({ description }) => (
  <div className="row">
    <form className="col s12">
      <div className="row">
        <div className="input-field col s12">
          <textarea id="textarea1" className="materialize-textarea" />
          <label htmlFor="textarea1">Event Description</label>
        </div>
      </div>
    </form>
  </div>
);

export default titleBox;
