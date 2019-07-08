import React from 'react';
// import M from 'materialize-css';

const descBox = ({ description }) => (
  <div className="row">
    <div className="input-field col s6">
      <input value={description} id="first_name2" type="text" className="validate" />
      <label className="active" htmlFor="first_name2">
        Description
      </label>
    </div>
  </div>
);

export default descBox;
