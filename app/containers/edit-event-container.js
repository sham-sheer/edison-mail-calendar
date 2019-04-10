import { editEventBegin } from '../actions/events';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import EditEvent from '../components/editEvent';

const mapStateToProps = state => {
  return {
    providers: state.auth.providers
  };
};

const mapDispatchToProps = dispatch => ({
  editEventBegin: (id, eventObject, providerType) => dispatch(editEventBegin(id, eventObject, providerType))
});

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(EditEvent));
