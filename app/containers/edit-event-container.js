import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  editEventBegin,
  editEwsSingleEventBegin,
  editEwsFutureEventBegin,
  editEwsAllEventBegin
} from '../actions/events';
import { beginUpdateCalendarObject } from '../actions/caldav';
import EditEvent from '../components/editEvent';

const mapStateToProps = (state) => ({
  providers: state.auth.providers,
  updateEventObject: state.events.updateEventObject
});

const mapDispatchToProps = (dispatch) => ({
  editEventBegin: (id, eventObject, providerType) =>
    dispatch(editEventBegin(id, eventObject, providerType)),
  beginUpdateCalendarObject: (event, options) =>
    dispatch(beginUpdateCalendarObject(event, options)),

  editEwsSingleEventBegin: (event) => dispatch(editEwsSingleEventBegin(event)),
  editEwsAllEventBegin: (event) => dispatch(editEwsAllEventBegin(event)),
  editEwsFutureEventBegin: (event) => dispatch(editEwsFutureEventBegin(event))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(EditEvent));
