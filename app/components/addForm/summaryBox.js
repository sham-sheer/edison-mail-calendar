import React from 'react';
// import M from 'materialize-css';

const summaryBox = ({ summary }) => (
  <div className="row">
    <div className="input-field col s6">
      <input value={summary} id="first_name2" type="text" className="validate" />
      <label className="active" htmlFor="first_name2">
        Title
      </label>
    </div>
  </div>
);

export default summaryBox;
