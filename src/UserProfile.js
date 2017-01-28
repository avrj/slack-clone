import React, { Component } from 'react';
import Person from 'material-ui/svg-icons/social/person';

class UserProfile extends Component {
  render() {
    return (
      <div className="Padding1">
        <Person className="VerticalAlignMiddle" /> {this.props.loggedUser}
      </div>
    );
  }
}

UserProfile.propTypes = {
  loggedUser: React.PropTypes.string.isRequired,
};

export default UserProfile;
