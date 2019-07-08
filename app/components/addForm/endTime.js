import React from 'react';
// import M from 'materialize-css';

const endBox = ({ end }) => (
  <div className="row">
    <div className="input-field col s6">
      <input value={end} id="first_name2" type="text" className="validate" />
      <label className="active" htmlFor="first_name2">
        End time
      </label>
    </div>
  </div>
);

export default endBox;
