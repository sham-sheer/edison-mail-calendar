import React from "react";

export default class signupSyncLink extends React.Component {
  capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  render() {
    if (this.props.providerInfo.length <= 0) {
      return <div></div>;
    }

    var renderArray = [];
    for(var i = 0; i < this.props.providerInfo.length; i++) {
      renderArray.push(
        <button className="btn btn-block btn-social" key={i}
          onClick={() => this.props.providerFunc()}>
          <span className="fa fa-outlook"></span>
        Sync {this.props.providerInfo[i].email} token, token expired!
        </button>);
    }

    return (
      <>
      {renderArray}
      </>
      // <div>
      //   <a>
      //     <button className="btn btn-block btn-social"
      //       onClick={() => this.authorizeGoogleCodeRequest()}>
      //       <span className="fa fa-outlook"></span>
      //         Sign in with {this.capitalize(this.props.providerType)}
      //     </button>
      //   </a>

    //   <button className="btn btn-block btn-social"
    //     onClick={() => {console.log(this.state.temp_outlookUser); this.props.beginGetOutlookEvents(this.state.temp_outlookUser);}}>
    //     <span className="fa fa-google"></span>
    //     Get {this.capitalize(this.props.providerType)} Events
    //   </button>
    // </div>
    );
  }
}