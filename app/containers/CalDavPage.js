import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CalDav from '../components/CalDav';
import * as CalDavActionCreators from '../caldav/actions';

function mapStateToProps(state) {
  return {
    caldav: state.caldav
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(CalDavActionCreators, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CalDav);
