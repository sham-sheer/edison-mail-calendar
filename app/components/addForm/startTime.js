import React from 'react';
import 'antd/dist/antd.css';
import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

class startBox extends React.Component {
  onChange = (value, dateString) => {
    console.log('Selected Time: ', value);
    console.log('Formatted Selected Time: ', dateString);
  };

  onOk = (value) => {
    console.log('onOk: ', value);
  };

  render() {
    return (
      <div>
        <RangePicker
          showTime={{ format: 'HH:mm' }}
          format="YYYY-MM-DD HH:mm"
          placeholder={['Start Time', 'End Time']}
          onChange={this.onChange}
          onOk={this.onOk}
        />
      </div>
    );
  }
}
// import M from 'materialize-css';

// const startBox = ({ start }) => (
//   <div className="row">
//     <div className="input-field col s6">
//       <input value={start} id="first_name2" type="text" className="validate" />
//       <label className="active" htmlFor="first_name2">
//         Start time
//       </label>
//     </div>
//   </div>
// );

export default startBox;
