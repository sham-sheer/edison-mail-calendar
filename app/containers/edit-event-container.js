import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { editEventBegin } from '../actions/events';
import { beginUpdateCalendarObject } from '../actions/caldav';
import EditEvent from '../components/editEvent';

const mapStateToProps = (state) => ({
  providers: state.auth.providers,
  updateEventObject: state.events.updateEventObject
});

const mapDispatchToProps = (dispatch) => ({
  editEventBegin: (id, eventObject, providerType) =>
    dispatch(editEventBegin(id, eventObject, providerType)),
  beginUpdateCalendarObject: (eventObject, options) =>
    dispatch(beginUpdateCalendarObject(eventObject, options))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(EditEvent));
