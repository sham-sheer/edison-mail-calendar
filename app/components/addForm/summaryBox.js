import React from 'react';
import M from 'materialize-css';

export default const summaryBox = ({ summary }) => {
  return(
    <div class="row">
      <div class="input-field col s6">
        <input value={summary} id="first_name2" type="text" class="validate">
        <label class="active" for="first_name2">Title</label>
      </div>
    </div>
  )
}
