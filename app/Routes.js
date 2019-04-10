// import React from 'react';
// import App from './containers/App';
// import { BrowserRouter as Router } from 'react-router-dom';
// import { Switch, Route } from 'react-router-dom';
// import CalendarEventForm from './containers/event-form-container';
// import ViewContainer from './containers/view-container';
// import OutLookRedirect from './components/redirect';
// import EditEvent from './components/editEvent';
// import { Provider } from 'react-redux';
// import { store } from './store/configureStore';

// export default () => (
//   <App>
//     <Provider store={store}>
//       <Router>
//         <Switch>
//           <Route path={"/outlook-redirect"} component={OutLookRedirect} />
//           <Route exact path="/" component={ViewContainer} />
//           <Route path="/:start/:end" component={CalendarEventForm} />
//           <Route path="/:id" component={EditEvent} />
//         </Switch>
//       </Router>
//     </Provider>
//   </App>
// );


import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import ViewContainer from './containers/view-container';
import OutLookRedirect from './components/redirect';
// import EditEvent from './components/editEvent';
import EditEventContainer from './containers/edit-event-container';
import CalendarEventForm from './containers/event-form-container';

export default () => (
  <App>
    <Switch>
      <Route path={"/outlook-redirect"} component={OutLookRedirect} />
      <Route exact path="/" component={ViewContainer} />
      <Route path="/:start/:end" component={CalendarEventForm} />
      <Route path="/:id" component={EditEventContainer} />
    </Switch>
  </App>
);
