import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { editEventBegin } from '../actions/events';
import EditEvent from '../components/editEvent';

const mapStateToProps = state => ({
  providers: state.auth.providers
});

const mapDispatchToProps = dispatch => ({
  editEventBegin: (id, eventObject, providerType) =>
    dispatch(editEventBegin(id, eventObject, providerType))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(EditEvent));
